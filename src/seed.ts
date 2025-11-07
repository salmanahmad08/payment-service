import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedUsersCommand } from './api/users/commands/seed-users.command';
import { SeedPlansCommand } from './api/subscriptions/commands/seed-plans.command';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // 1️⃣ Seed Users
  const userSeeder = app.get(SeedUsersCommand);
  await userSeeder.run();

  // 2️⃣ Seed Plans
  const planSeeder = app.get(SeedPlansCommand);
  await planSeeder.run();

  await app.close();
}

bootstrap();
