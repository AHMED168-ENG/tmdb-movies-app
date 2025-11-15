import { Module } from "@nestjs/common";
import { TMDBService } from "./tmdb.service";

@Module({
  providers: [TMDBService],
  exports: [TMDBService],
})
export class TMDBModule {}
