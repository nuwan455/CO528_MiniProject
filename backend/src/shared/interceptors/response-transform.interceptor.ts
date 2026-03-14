import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (value && typeof value === 'object' && 'success' in (value as Record<string, unknown>)) {
          return value;
        }

        if (
          value &&
          typeof value === 'object' &&
          'message' in (value as Record<string, unknown>) &&
          'data' in (value as Record<string, unknown>)
        ) {
          const payload = value as { message: string; data: unknown };
          return {
            success: true,
            message: payload.message,
            data: payload.data,
          };
        }

        return {
          success: true,
          message: 'Request completed successfully',
          data: value,
        };
      }),
    );
  }
}
