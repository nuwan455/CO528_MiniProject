import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthUser } from '../../shared/types/auth-user.type';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsQueryDto } from './dto/posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user, dto);
  }

  @Get()
  findAll(@Query() query: PostsQueryDto, @CurrentUser() user: AuthUser) {
    return this.postsService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, user, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(id, user);
  }

  @Post(':id/like')
  like(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.like(id, user);
  }

  @Delete(':id/like')
  unlike(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.unlike(id, user);
  }

  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.createComment(id, user, dto);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.postsService.listComments(id);
  }

  @Post(':id/share')
  share(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.share(id, user);
  }
}
