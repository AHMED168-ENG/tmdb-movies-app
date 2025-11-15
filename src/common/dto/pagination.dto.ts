import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min, Max } from "class-validator";

export class PaginationDto {
  @ApiPropertyOptional({ description: "Page number", default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Items per page",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({ description: "Data items" })
  data: T[];

  @ApiPropertyOptional({ description: "Total number of items" })
  total: number;

  @ApiPropertyOptional({ description: "Current page number" })
  page: number;

  @ApiPropertyOptional({ description: "Items per page" })
  limit: number;

  @ApiPropertyOptional({ description: "Total number of pages" })
  totalPages: number;

  @ApiPropertyOptional({ description: "Has next page" })
  hasNext: boolean;

  @ApiPropertyOptional({ description: "Has previous page" })
  hasPrev: boolean;
}
