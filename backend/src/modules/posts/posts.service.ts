import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../shared/types/auth-user.type';
import { buildPagination } from '../../shared/utils/pagination.util';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        authorId: user.sub,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        visibility: dto.visibility,
      },
      include: this.postInclude,
    });

    return { message: 'Post created successfully', data: post };
  }

  async findAll(query: PostsQueryDto, user: AuthUser) {
    const where: Prisma.PostWhereInput = {
      authorId: query.authorId,
      visibility: query.visibility,
      content: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
      ...(user.role === Role.STUDENT
        ? { NOT: { visibility: 'ALUMNI_ONLY' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: this.postInclude,
        orderBy: { createdAt: 'desc' },
        ...buildPagination(query.page, query.limit),
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      message: 'Posts fetched successfully',
      data: { items, meta: { total, page: query.page, limit: query.limit } },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.postInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return { message: 'Post fetched successfully', data: post };
  }

  async update(id: string, user: AuthUser, dto: UpdatePostDto) {
    await this.ensureOwnership(id, user);
    const post = await this.prisma.post.update({
      where: { id },
      data: dto,
      include: this.postInclude,
    });

    return { message: 'Post updated successfully', data: post };
  }

  async remove(id: string, user: AuthUser) {
    await this.ensureOwnership(id, user);
    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted successfully', data: null };
  }

  async like(postId: string, user: AuthUser) {
    await this.prisma.like.upsert({
      where: { postId_userId: { postId, userId: user.sub } },
      update: {},
      create: { postId, userId: user.sub },
    });

    return { message: 'Post liked successfully', data: null };
  }

  async unlike(postId: string, user: AuthUser) {
    await this.prisma.like.deleteMany({ where: { postId, userId: user.sub } });
    return { message: 'Post unliked successfully', data: null };
  }

  async createComment(postId: string, user: AuthUser, dto: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: { postId, authorId: user.sub, content: dto.content },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    return { message: 'Comment created successfully', data: comment };
  }

  async listComments(postId: string) {
    const items = await this.prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return { message: 'Comments fetched successfully', data: items };
  }

  async share(postId: string, user: AuthUser) {
    const share = await this.prisma.share.create({ data: { postId, userId: user.sub } });
    return { message: 'Post shared successfully', data: share };
  }

  private async ensureOwnership(id: string, user: AuthUser): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== user.sub && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You cannot modify this post');
    }
  }

  private readonly postInclude = {
    author: { select: { id: true, name: true, role: true, headline: true } },
    _count: { select: { likes: true, comments: true, shares: true } },
  } satisfies Prisma.PostInclude;
}
