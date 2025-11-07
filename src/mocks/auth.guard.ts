import { CanActivate, ExecutionContext } from '@nestjs/common';

export class JwtAuthGuardMock implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Mock a user
    request.user = {
      id: 'user_mock_123',
      email: 'mock@example.com',
    };
    return true;
  }
}
