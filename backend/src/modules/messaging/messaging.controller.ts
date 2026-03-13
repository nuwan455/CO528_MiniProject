import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthUser } from '../../shared/types/auth-user.type';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  createConversation(@CurrentUser() user: AuthUser, @Body() dto: CreateConversationDto) {
    return this.messagingService.createConversation(user, dto);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthUser) {
    return this.messagingService.listConversations(user);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.messagingService.getConversation(id, user);
  }

  @Post('conversations/:id/messages')
  createMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagingService.createMessage(id, user, dto);
  }

  @Get('conversations/:id/messages')
  listMessages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.messagingService.listMessages(id, user);
  }
}
