import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../shared/types/auth-user.type';
import { buildPagination } from '../../shared/utils/pagination.util';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';

type SerializedPost = {
  id: string;
  authorId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'NONE';
  visibility: 'PUBLIC' | 'DEPARTMENT_ONLY' | 'ALUMNI_ONLY';
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    role: string;
    headline: string | null;
    profileImageUrl: string | null;
  };
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
  interactions: {
    isLiked: boolean;
    isShared: boolean;
  };
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreatePostDto) {
    const content = dto.content?.trim() ?? '';
    this.ensurePostHasContentOrMedia(content, dto.mediaUrl);

    const post = await this.prisma.post.create({
      data: {
        authorId: user.sub,
        content,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        visibility: dto.visibility,
      },
      include: this.buildPostInclude(user.sub),
    });

    return { message: 'Post created successfully', data: this.serializePost(post) };
  }

  async findAll(query: PostsQueryDto, user: AuthUser) {
    const where = {
      authorId: query.authorId,
      visibility: query.visibility,
      content: query.q
        ? { contains: query.q, mode: 'insensitive' as const }
        : undefined,
      NOT: user.role === 'STUDENT' ? [{ visibility: 'ALUMNI_ONLY' as const }] : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: this.buildPostInclude(user.sub),
        orderBy: { createdAt: 'desc' },
        ...buildPagination(query.page, query.limit),
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      message: 'Posts fetched successfully',
      data: {
        items: items.map((item) => this.serializePost(item)),
        meta: { total, page: query.page, limit: query.limit },
      },
    };
  }

  async findOne(id: string, user: AuthUser) {
    const post = await this.findAccessiblePost(id, user);
    return {
      message: 'Post fetched successfully',
      data: this.serializePost(post),
    };
  }

  async update(id: string, user: AuthUser, dto: UpdatePostDto) {
    await this.ensureOwnership(id, user);
    const nextContent = dto.content?.trim();

    if (
      nextContent !== undefined ||
      dto.mediaUrl !== undefined
    ) {
      const existingPost = await this.prisma.post.findUnique({ where: { id } });
      if (!existingPost) {
        throw new NotFoundException('Post not found');
      }

      this.ensurePostHasContentOrMedia(
        nextContent ?? existingPost.content,
        dto.mediaUrl ?? existingPost.mediaUrl,
      );
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        content: nextContent,
      },
      include: this.buildPostInclude(user.sub),
    });

    return { message: 'Post updated successfully', data: this.serializePost(post) };
  }

  async remove(id: string, user: AuthUser) {
    await this.ensureDeleteOwnership(id, user);
    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted successfully', data: null };
  }

  async like(postId: string, user: AuthUser) {
    await this.ensurePostExists(postId, user);
    await this.prisma.like.upsert({
      where: { postId_userId: { postId, userId: user.sub } },
      update: {},
      create: { postId, userId: user.sub },
    });

    return { message: 'Post liked successfully', data: null };
  }

  async unlike(postId: string, user: AuthUser) {
    await this.ensurePostExists(postId, user);
    await this.prisma.like.deleteMany({ where: { postId, userId: user.sub } });
    return { message: 'Post unliked successfully', data: null };
  }

  async createComment(postId: string, user: AuthUser, dto: CreateCommentDto) {
    await this.ensurePostExists(postId, user);
    const comment = await this.prisma.comment.create({
      data: { postId, authorId: user.sub, content: dto.content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            headline: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return { message: 'Comment created successfully', data: comment };
  }

  async listComments(postId: string, user: AuthUser) {
    await this.ensurePostExists(postId, user);
    const items = await this.prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            headline: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { message: 'Comments fetched successfully', data: items };
  }

  async share(postId: string, user: AuthUser) {
    await this.ensurePostExists(postId, user);
    const share = await this.prisma.share.create({ data: { postId, userId: user.sub } });
    return { message: 'Post shared successfully', data: share };
  }

  private async ensureOwnership(id: string, user: AuthUser): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== user.sub && user.role !== 'ADMIN') {
      throw new ForbiddenException('You cannot modify this post');
    }
  }

  private async ensureDeleteOwnership(id: string, user: AuthUser): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== user.sub) {
      throw new ForbiddenException('You can delete only your own posts');
    }
  }

  private ensurePostHasContentOrMedia(content?: string | null, mediaUrl?: string | null) {
    if (!content?.trim() && !mediaUrl?.trim()) {
      throw new BadRequestException('Post content or media is required');
    }
  }

  private async ensurePostExists(id: string, user: AuthUser) {
    await this.findAccessiblePost(id, user);
  }

  private async findAccessiblePost(id: string, user: AuthUser) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.buildPostInclude(user.sub),
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.visibility === 'ALUMNI_ONLY' && user.role === 'STUDENT') {
      throw new ForbiddenException('You do not have access to this post');
    }

    return post;
  }

  private serializePost(post: any): SerializedPost {
    const { likes, shares, ...rest } = post;

    return {
      ...rest,
      interactions: {
        isLiked: likes.length > 0,
        isShared: shares.length > 0,
      },
    };
  }

  private buildPostInclude(userId: string) {
    return {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          headline: true,
          profileImageUrl: true,
        },
      },
      likes: {
        where: { userId },
        select: { id: true },
      },
      shares: {
        where: { userId },
        select: { id: true },
      },
      _count: { select: { likes: true, comments: true, shares: true } },
    };
  }
}
