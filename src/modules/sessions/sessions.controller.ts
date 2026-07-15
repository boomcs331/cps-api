import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role-code.enum';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.SUPER_ADMIN)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    return this.sessionsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      userId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.sessionsService.revoke(id);
  }

  @Post('revoke-all/:userId')
  revokeAllUserSessions(@Param('userId') userId: string) {
    return this.sessionsService.revokeAllUserSessions(userId);
  }
}
