import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2';
import { isInstance } from "class-validator";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService{
    constructor(
        private prsima: PrismaService, 
        private jwt: JwtService,
        private config: ConfigService,
        ) {}
    async signup(dto: AuthDto) {
        //generate the password
        const hash = await argon.hash(dto.password);
        // save new user to db
        try {
            const user = await this.prsima.user.create({
                data: {
                    email: dto.email,
                    hash,
                }
            });
            delete user.hash;
            // return the user 
            return this.signToken(user.id, user.email);
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email already exists');
                }
            }
            throw error;
        }
    }
    async signin(dto: AuthDto) {
        // find the user by email
        const user = await this.prsima.user.findUnique({
            where : {
                email: dto.email,
            }
        });

        // if user doesn not exist throw exception
        if (!user) {
            throw new ForbiddenException('Invalid email');
        }
        // compare password
        const pwMatches = await argon.verify(user.hash, dto.password);
        // if password incorrect throw exception
        if(!pwMatches) {
            throw new ForbiddenException('Invalid password');
        }
        delete user.hash;
        // return the user
        return this.signToken(user.id, user.email);
    }

    async signToken(userId: number, email: string): Promise<{access_token}>{
        const data = { sub: userId, email };
        const secret = this.config.get('JWT_SECRET');
        const token = await this.jwt.signAsync(data, {
            expiresIn: '60m',
            secret: secret,
        });

        return {access_token: token};
    }
}