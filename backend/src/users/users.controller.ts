import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: any) { return this.users.getProfile(req.user.userId) }

  @Patch('me')
  update(@Req() req: any, @Body() body: { name?: string }) { return this.users.updateProfile(req.user.userId, body) }
}


