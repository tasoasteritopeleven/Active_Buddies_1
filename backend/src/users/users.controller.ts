import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UsersService, PublicUser } from './users.service';
import { DiscoverQueryDto, ListUsersQueryDto, UpdateUserDto } from './dto/users.dto';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.users.me(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return this.users.updateMe(user.id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by query string' })
  async search(
    @Query() query: ListUsersQueryDto,
  ): Promise<{ items: PublicUser[]; total: number }> {
    return this.users.search(query);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Discover new pals (excludes existing connections)' })
  async discover(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DiscoverQueryDto,
  ): Promise<{ items: PublicUser[]; total: number }> {
    return this.users.discover(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile of a user by id' })
  async getById(@Param('id', new ParseUUIDPipe()) id: string): Promise<PublicUser> {
    return this.users.getById(id);
  }
}
