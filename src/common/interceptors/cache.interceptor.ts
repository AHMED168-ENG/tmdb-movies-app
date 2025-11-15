import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== "GET") {
      return next.handle();
    }
    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = await this.cacheManager.get(cacheKey);
    console.log(cacheKey);
    console.log(cachedResponse);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, 300); // 5 minutes TTL
      })
    );
  }

  private generateCacheKey(request: any): string {
    const url = request.url;
    const query = JSON.stringify(request.query);
    return `${url}_${query}`;
  }
}
