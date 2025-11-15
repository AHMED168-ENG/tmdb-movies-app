import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class MovieFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Search term for title or overview" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by genre", example: "Action" })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    description: "Sort by field",
    enum: ["title", "releaseDate", "popularity", "tmdbVoteAverage"],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: "Sort order", enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({ description: "Filter by release year" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;
}

export class RateMovieDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  userId: string;

  @ApiProperty({ description: "Rating value (1-10)", minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  rating: number;
}

export class WatchlistDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  userId: string;
}

export class FavoriteDto {
  @ApiProperty({ description: "User ID" })
  @IsString()
  userId: string;
}

export class CreateMovieDto {
  @ApiProperty({ description: "TMDB movie ID" })
  @IsNumber()
  tmdbId: number;

  @ApiProperty({ description: "Movie title" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Movie overview" })
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional({ description: "Release date" })
  @IsOptional()
  releaseDate?: Date;

  @ApiPropertyOptional({ description: "Poster path" })
  @IsOptional()
  @IsString()
  posterPath?: string;

  @ApiPropertyOptional({ description: "Backdrop path" })
  @IsOptional()
  @IsString()
  backdropPath?: string;

  @ApiPropertyOptional({ description: "Genres", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ description: "Genre IDs", type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  genreIds?: number[];

  @ApiPropertyOptional({ description: "TMDB vote average" })
  @IsOptional()
  @IsNumber()
  tmdbVoteAverage?: number;

  @ApiPropertyOptional({ description: "TMDB vote count" })
  @IsOptional()
  @IsNumber()
  tmdbVoteCount?: number;

  @ApiPropertyOptional({ description: "Popularity" })
  @IsOptional()
  @IsNumber()
  popularity?: number;

  @ApiPropertyOptional({ description: "Runtime in minutes" })
  @IsOptional()
  @IsNumber()
  runtime?: number;

  @ApiPropertyOptional({ description: "Budget" })
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ description: "Revenue" })
  @IsOptional()
  @IsNumber()
  revenue?: number;

  @ApiPropertyOptional({ description: "Original language" })
  @IsOptional()
  @IsString()
  originalLanguage?: string;
}

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
