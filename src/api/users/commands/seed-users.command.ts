import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';

@Injectable()
export class SeedUsersCommand {
  private readonly logger = new Logger(SeedUsersCommand.name);

  constructor(private readonly usersService: UsersService) {}

  async run() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'password123';
    const name = process.env.SEED_ADMIN_NAME || 'Admin User';

    this.logger.log('🚀 Seeding default user...');

    // ✅ Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      this.logger.log(
        `⚠️ User with email "${email}" already exists. Skipping creation.`,
      );
      return existingUser;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });

    this.logger.log('✅ User seeded successfully!');
    return user;
  }
}
