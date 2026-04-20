import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat.service';
import type { JwtPayload } from '../../auth/auth.service';

interface AuthenticatedSocket extends Socket {
  data: { userId?: string; email?: string };
}

@WebSocketGateway({
  namespace: '/ws/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly chat: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.headers.authorization?.replace(/^Bearer /i, '') ?? '');
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      // Join a personal room so we can push events to this user anywhere
      await client.join(`user:${payload.sub}`);
      this.logger.log(`WS connected: ${payload.email} (${client.id})`);
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`WS disconnected: ${client.data.email ?? 'anonymous'} (${client.id})`);
  }

  @SubscribeMessage('conversation:join')
  async onJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): Promise<{ ok: boolean }> {
    if (!client.data.userId) return { ok: false };
    await this.chat.assertParticipant(data.conversationId, client.data.userId);
    await client.join(`conversation:${data.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  async onLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): Promise<{ ok: boolean }> {
    await client.leave(`conversation:${data.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('conversation:typing')
  onTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ): void {
    if (!client.data.userId) return;
    client.to(`conversation:${data.conversationId}`).emit('conversation:typing', {
      conversationId: data.conversationId,
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  /** Called by ChatController after persisting a message. */
  broadcastMessage(conversationId: string, message: unknown): void {
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
  }

  /** Push a direct event to a specific user (across all their sockets). */
  pushToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
