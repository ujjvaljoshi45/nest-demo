import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { User } from '@prisma/client';

@Controller('users')
export class UserController {
    // endpoint 'users/me'
    @Get('me')
    @UseGuards(JwtGuard)
    getMe(@GetUser() user: User) {
        return user;
    }

    @Patch()
    editUser() {
        
    }
}