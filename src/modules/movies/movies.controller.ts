import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from "@nestjs/swagger";
import { MoviesService } from "./movies.service";
import {
  CreateMovieDto,
  UpdateMovieDto,
  MovieFilterDto,
  RateMovieDto,
  WatchlistDto,
  FavoriteDto,
} from "./dto/movie.dto";
import { Movie } from "./schemas/movie.schema";
import { ApiKeyGuard } from "../../common/guards/api-key.guard";
import { CacheInterceptor } from "../../common/interceptors/cache.interceptor";
import { PaginatedResponseDto } from "../../common/dto/pagination.dto";
import { ApiResponseDto } from "../../common/dto/response.dto";

@ApiTags("Movies")
@Controller("movies")
@UseGuards(ApiKeyGuard)
@ApiSecurity("api-key")
@UseInterceptors(CacheInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new movie" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Movie created successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Movie with this TMDB ID already exists",
  })
  async create(
    @Body() createMovieDto: CreateMovieDto
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.create(createMovieDto);
    return new ApiResponseDto(true, "Movie created successfully", movie);
  }

  @Get()
  @ApiOperation({
    summary: "Get all movies with filtering, pagination, and search",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movies retrieved successfully",
  })
  async findAll(
    @Query() filterDto: MovieFilterDto
  ): Promise<ApiResponseDto<PaginatedResponseDto<Movie>>> {
    const result = await this.moviesService.findAll(filterDto);
    return new ApiResponseDto(true, "Movies retrieved successfully", result);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a movie by ID" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie retrieved successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async findOne(@Param("id") id: string): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.findOne(id);
    return new ApiResponseDto(true, "Movie retrieved successfully", movie);
  }

  @Get("tmdb/:tmdbId")
  @ApiOperation({ summary: "Get a movie by TMDB ID" })
  @ApiParam({ name: "tmdbId", description: "TMDB Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie retrieved successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async findByTmdbId(
    @Param("tmdbId") tmdbId: number
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.findByTmdbId(tmdbId);
    return new ApiResponseDto(true, "Movie retrieved successfully", movie);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a movie" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie updated successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async update(
    @Param("id") id: string,
    @Body() updateMovieDto: UpdateMovieDto
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.update(id, updateMovieDto);
    return new ApiResponseDto(true, "Movie updated successfully", movie);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a movie" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie deleted successfully",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async remove(@Param("id") id: string): Promise<ApiResponseDto<null>> {
    await this.moviesService.remove(id);
    return new ApiResponseDto(true, "Movie deleted successfully");
  }

  @Post(":id/rate")
  @ApiOperation({ summary: "Rate a movie" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie rated successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async rateMovie(
    @Param("id") id: string,
    @Body() rateMovieDto: RateMovieDto
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.rateMovie(id, rateMovieDto);
    return new ApiResponseDto(true, "Movie rated successfully", movie);
  }

  @Post(":id/watchlist")
  @ApiOperation({ summary: "Add movie to watchlist" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie added to watchlist successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async addToWatchlist(
    @Param("id") id: string,
    @Body() watchlistDto: WatchlistDto
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.addToWatchlist(
      id,
      watchlistDto.userId
    );
    return new ApiResponseDto(
      true,
      "Movie added to watchlist successfully",
      movie
    );
  }

  @Delete(":id/watchlist")
  @ApiOperation({ summary: "Remove movie from watchlist" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie removed from watchlist successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async removeFromWatchlist(
    @Param("id") id: string,
    @Body() watchlistDto: WatchlistDto
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.removeFromWatchlist(
      id,
      watchlistDto.userId
    );
    return new ApiResponseDto(
      true,
      "Movie removed from watchlist successfully",
      movie
    );
  }

  @Post(":id/favorites")
  @ApiOperation({ summary: "Add movie to favorites" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie added to favorites successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async addToFavorites(
    @Param("id") id: string,
    @Body() favoriteDto: FavoriteDto
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.addToFavorites(
      id,
      favoriteDto.userId
    );
    return new ApiResponseDto(
      true,
      "Movie added to favorites successfully",
      movie
    );
  }

  @Delete(":id/favorites")
  @ApiOperation({ summary: "Remove movie from favorites" })
  @ApiParam({ name: "id", description: "Movie ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movie removed from favorites successfully",
    type: Movie,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Movie not found",
  })
  async removeFromFavorites(
    @Param("id") id: string,
    @Body() favoriteDto: FavoriteDto
  ): Promise<ApiResponseDto<Movie>> {
    const movie = await this.moviesService.removeFromFavorites(
      id,
      favoriteDto.userId
    );
    return new ApiResponseDto(
      true,
      "Movie removed from favorites successfully",
      movie
    );
  }

  @Post("sync-tmdb")
  @ApiOperation({ summary: "Sync movies from TMDB" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Movies synced successfully from TMDB",
  })
  async syncFromTMDB(
    @Query("pages") pages?: number
  ): Promise<ApiResponseDto<{ imported: number; skipped: number }>> {
    const result = await this.moviesService.syncFromTMDB(pages || 5);
    return new ApiResponseDto(
      true,
      "Movies synced successfully from TMDB",
      result
    );
  }
}
