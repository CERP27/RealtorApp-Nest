import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

interface SignupParams {
  email: string;
  password: string;
  name: string;
  phone: string;
}

interface SigninParams {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async signup(
    { email, password, name, phone }: SignupParams,
    userType: UserType,
  ) {
    const userExists = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (userExists) {
      throw new ConflictException();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prismaService.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        user_type: userType,
      },
    });

    return await this.generateJWT(name, newUser.id);
  }

  async signin({ email, password }: SigninParams) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new HttpException('Invalid credentials', 400);
    }

    const hashedPassword = user.password;

    const isValidPassword = await bcrypt.compare(password, hashedPassword);

    if (!isValidPassword) {
      throw new HttpException('Invalid credentials', 400);
    }

    return await this.generateJWT(user.name, user.id);
  }

  private generateJWT(name: string, id: number) {
    return jwt.sign(
      {
        name,
        id,
      },
      process.env.JSON_TOKEN_KEY,
      {
        expiresIn: 864000,
      },
    );
  }

  generateProductKey(email: string, userType: UserType) {
    const string = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

    return bcrypt.hash(string, 10);
  }
}
