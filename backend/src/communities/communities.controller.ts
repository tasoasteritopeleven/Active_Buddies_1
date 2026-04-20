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

import { CommunitiesService } from './communities.service';
import { CreateCommunityDto, ListCommunitiesQueryDto } from './dto/communities.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Communities')
@ApiBearerAuth()
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly svc: CommunitiesService) {}

  @Get()
  async list(@Query() query: ListCommunitiesQueryDto) {
    return this.svc.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new community' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommunityDto,
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

  @Get(':id/members')
  async members(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.members(id);
  }
}
