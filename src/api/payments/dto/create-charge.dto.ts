import { IsNumber, IsString, Min, IsOptional } from 'class-validator';

export class CreateChargeDto {
  @IsNumber()
  @Min(1)
  amount: number; // in cents or smallest currency unit

  @IsString()
  currency: string; // e.g., 'usd', 'pkr'

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  customerId: string; // pass existing Stripe customer ID
}
