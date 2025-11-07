import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'planId is required' })
  planId: string;

  @IsString()
  @IsNotEmpty({ message: 'customerId is required' })
  customerId: string;
}
