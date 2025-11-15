import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsArray } from "class-validator";

export class UpdateMovieDto {
  @ApiPropertyOptional({ description: "Movie title" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Movie overview" })
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional({ description: "Genres", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];
}
