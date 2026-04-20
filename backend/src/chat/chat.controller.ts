import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ChatService } from './chat.service';
import { CreateConversationDto, ListMessagesQueryDto, SendMessageDto } from './dto/chat.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ChatGateway } from './gateway/chat.gateway';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations for the current user' })
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.chat.listConversations(user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create (or fetch existing) conversation' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chat.createConversation(user.id, dto);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  async messages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.chat.listMessages(id, user.id, query.limit, query.offset);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message to a conversation' })
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chat.sendMessage(id, user.id, dto);
    this.gateway.broadcastMessage(id, message);
    return message;
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a conversation as read' })
  async read(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.chat.markRead(id, user.id);
  }
}
