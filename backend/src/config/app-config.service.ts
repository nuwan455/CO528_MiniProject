import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return Number(this.configService.get<string>('PORT', '4000'));
  }

  get apiPrefix(): string {
    return this.configService.get<string>('API_PREFIX', 'api/v1');
  }

  get webClientUrl(): string {
    return this.configService.get<string>('WEB_CLIENT_URL', 'http://localhost:3000');
  }

  get mobileClientUrl(): string {
    return this.configService.get<string>('MOBILE_CLIENT_URL', 'exp://localhost:8081');
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get jwtAccessSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  get jwtAccessExpiresIn(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  get redisUrl(): string {
    return this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
  }

  get uploadDriver(): string {
    return this.configService.get<string>('UPLOAD_DRIVER', 'local');
  }

  get uploadDir(): string {
    return this.configService.get<string>('UPLOAD_DIR', 'uploads');
  }

  get maxFileSize(): number {
    return Number(this.configService.get<string>('MAX_FILE_SIZE', '5242880'));
  }
}
