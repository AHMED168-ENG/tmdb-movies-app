import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      "isPublic",
      context.getHandler()
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-api-key"];
    const expectedApiKey = this.configService.get<string>("API_KEY");

    if (!expectedApiKey) {
      return true; // If no API key is configured, allow access
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      throw new UnauthorizedException("Invalid or missing API key");
    }

    return true;
  }
}
