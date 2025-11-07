import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard) // protect all routes inside this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Logged-in user details
  @Get('me')
  getLoggedInUser(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  // ✅ Get user by ID (admin scenario later)
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
