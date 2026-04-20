import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MatchingService, MatchSuggestion } from './matching.service';
import { ConnectionRequestBodyDto, MatchPaginationDto } from './dto/matching.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Matching')
@ApiBearerAuth()
@Controller('matching')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('suggestions')
  @ApiOperation({ summary: 'Get personalized match suggestions for the current user' })
  async suggestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MatchPaginationDto,
  ): Promise<MatchSuggestion[]> {
    return this.matching.suggestions(user.id, query.limit, query.offset);
  }

  @Post('request/:userId')
  @ApiOperation({ summary: 'Send a connection request to another user' })
  async sendRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) targetId: string,
    @Body() body: ConnectionRequestBodyDto,
  ) {
    return this.matching.sendRequest(user.id, targetId, body.message);
  }

  @Get('requests/incoming')
  @ApiOperation({ summary: 'List pending incoming connection requests' })
  async incoming(@CurrentUser() user: AuthenticatedUser) {
    return this.matching.listIncoming(user.id);
  }

  @Get('requests/outgoing')
  @ApiOperation({ summary: 'List pending outgoing connection requests' })
  async outgoing(@CurrentUser() user: AuthenticatedUser) {
    return this.matching.listOutgoing(user.id);
  }

  @Post('requests/:requestId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a pending incoming request' })
  async accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.matching.accept(user.id, requestId);
  }

  @Post('requests/:requestId/decline')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Decline a pending incoming request' })
  async decline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('requestId', new ParseUUIDPipe()) requestId: string,
  ): Promise<void> {
    await this.matching.decline(user.id, requestId);
  }

  @Get('connections')
  @ApiOperation({ summary: 'List accepted connections' })
  async connections(@CurrentUser() user: AuthenticatedUser) {
    return this.matching.listConnections(user.id);
  }

  @Delete('connections/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an accepted connection' })
  async removeConnection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) otherUserId: string,
  ): Promise<void> {
    await this.matching.remove(user.id, otherUserId);
  }
}
