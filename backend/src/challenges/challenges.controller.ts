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

import { ChallengesService } from './challenges.service';
import {
  CreateChallengeDto,
  ListChallengesQueryDto,
  UpdateProgressDto,
} from './dto/challenges.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Challenges')
@ApiBearerAuth()
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly svc: ChallengesService) {}

  @Get()
  async list(@Query() query: ListChallengesQueryDto) {
    return this.svc.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new challenge' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateChallengeDto,
  ) {
    return this.svc.create(user.id, dto);
  }

  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.getById(id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  async join(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.join(user.id, id);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.svc.leave(user.id, id);
  }

  @Post(':id/progress')
  @ApiOperation({ summary: 'Update current user progress on this challenge' })
  async progress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.svc.updateProgress(user.id, id, dto.progress);
  }

  @Get(':id/leaderboard')
  async leaderboard(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.leaderboard(id);
  }
}
