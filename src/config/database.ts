import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';

export const connectDB = async () => {
  const configService = new ConfigService();
  const dbUri = configService.get<string>('MONGO_URI');
  if (!dbUri) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri);
    console.log('MongoDB Connected Successfully!');
  } catch (err) {
    console.error('MongoDB Connection Failed!', err);
    process.exit(1);
  }
};
