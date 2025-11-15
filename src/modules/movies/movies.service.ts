import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Movie, MovieDocument } from "./schemas/movie.schema";
import { TMDBService } from "../tmdb/tmdb.service";
import {
  CreateMovieDto,
  UpdateMovieDto,
  MovieFilterDto,
  RateMovieDto,
} from "./dto/movie.dto";
import { PaginatedResponseDto } from "../../common/dto/pagination.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    private tmdbService: TMDBService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const existingMovie = await this.movieModel.findOne({
      tmdbId: createMovieDto.tmdbId,
    });

    if (existingMovie) {
      throw new BadRequestException("Movie with this TMDB ID already exists");
    }

    const createdMovie = new this.movieModel(createMovieDto);
    await this.cacheManager.del("movies_list");
    return createdMovie.save();
  }

  // Helper method to calculate average rating
  private calculateMovieAverage(movie: MovieDocument): any {
    const movieObj = movie.toObject();
    const userRatings = movieObj.userRatings || [];

    let averageRating = 0;
    if (userRatings.length > 0) {
      const sum = userRatings.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = Math.round((sum / userRatings.length) * 10) / 10;
    }

    return {
      ...movieObj,
      averageRating,
      totalRatings: userRatings.length,
    };
  }

  async findAll(
    filterDto: MovieFilterDto
  ): Promise<PaginatedResponseDto<Movie>> {
    const {
      page = 1,
      limit = 20,
      search,
      genre,
      sortBy = "createdAt",
      sortOrder = "desc",
      year,
    } = filterDto;

    const cacheKey = `movies_${JSON.stringify(filterDto)}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      return cached as PaginatedResponseDto<Movie>;
    }

    const query: any = {};

    // Search in title and overview
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by genre
    if (genre) {
      query.genres = { $in: [genre] };
    }

    // Filter by year
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.releaseDate = { $gte: startDate, $lte: endDate };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;
    const [movies, total] = await Promise.all([
      this.movieModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.movieModel.countDocuments(query),
    ]);

    // Add average rating to each movie
    const moviesWithAverage = movies.map((movie) =>
      this.calculateMovieAverage(movie)
    );

    const result = {
      data: moviesWithAverage,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async findOne(id: string): Promise<Movie> {
    const cacheKey = `movie_${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as Movie;
    }

    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    const movieWithAverage = this.calculateMovieAverage(movie);
    await this.cacheManager.set(cacheKey, movieWithAverage, 300);
    return movieWithAverage;
  }

  async findByTmdbId(tmdbId: number): Promise<Movie> {
    const cacheKey = `movie_tmdb_${tmdbId}`;
    const cached = await this.cacheManager.get(cacheKey);
    console.log(cached);

    if (cached) {
      return cached as Movie;
    }

    const movie = await this.movieModel.findOne({ tmdbId }).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with TMDB ID "${tmdbId}" not found`);
    }

    const movieWithAverage = this.calculateMovieAverage(movie);
    await this.cacheManager.set(cacheKey, movieWithAverage, 300);
    return movieWithAverage;
  }

  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.movieModel
      .findByIdAndUpdate(id, updateMovieDto, { new: true })
      .exec();

    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    await this.cacheManager.del(`movie_${id}`);
    await this.cacheManager.del(`movie_tmdb_${movie.tmdbId}`);
    await this.cacheManager.del("movies_list");

    return movie;
  }

  async remove(id: string): Promise<void> {
    const movie = await this.movieModel.findByIdAndDelete(id).exec();

    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    await this.cacheManager.del(`movie_${id}`);
    await this.cacheManager.del(`movie_tmdb_${movie.tmdbId}`);
    await this.cacheManager.del("movies_list");
  }

  async rateMovie(id: string, rateMovieDto: RateMovieDto): Promise<Movie> {
    const { userId, rating } = rateMovieDto;

    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    // Check if user already rated this movie
    const existingRatingIndex = movie.userRatings.findIndex(
      (r) => r.userId === userId
    );

    if (existingRatingIndex >= 0) {
      // Update existing rating
      movie.userRatings[existingRatingIndex].rating = rating;
      movie.userRatings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      movie.userRatings.push({
        userId,
        rating,
        createdAt: new Date(),
      });
    }

    await movie.save();

    await this.cacheManager.del(`movie_${id}`);
    await this.cacheManager.del(`movie_tmdb_${movie.tmdbId}`);
    await this.cacheManager.del("movies_list");

    return movie;
  }

  async addToWatchlist(id: string, userId: string): Promise<Movie> {
    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    if (!movie.watchlistUsers.includes(userId)) {
      movie.watchlistUsers.push(userId);
      await movie.save();
    }

    await this.cacheManager.del(`movie_${id}`);
    await this.cacheManager.del(`movie_tmdb_${movie.tmdbId}`);

    return movie;
  }

  async removeFromWatchlist(id: string, userId: string): Promise<Movie> {
    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    movie.watchlistUsers = movie.watchlistUsers.filter((uid) => uid !== userId);
    await movie.save();

    await this.cacheManager.del(`movie_${id}`);
    await this.cacheManager.del(`movie_tmdb_${movie.tmdbId}`);

    return movie;
  }

  async addToFavorites(id: string, userId: string): Promise<Movie> {
    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    if (!movie.favoriteUsers.includes(userId)) {
      movie.favoriteUsers.push(userId);
      await movie.save();
    }

    await this.cacheManager.del(`movie_${id}`);
    await this.cacheManager.del(`movie_tmdb_${movie.tmdbId}`);

    return movie;
  }

  async removeFromFavorites(id: string, userId: string): Promise<Movie> {
    const movie = await this.movieModel.findById(id).exec();
    if (!movie) {
      throw new NotFoundException(`Movie with ID "${id}" not found`);
    }

    movie.favoriteUsers = movie.favoriteUsers.filter((uid) => uid !== userId);
    await movie.save();

    await this.cacheManager.del(`movie_${id}`);
    await this.cacheManager.del(`movie_tmdb_${movie.tmdbId}`);

    return movie;
  }

  async syncFromTMDB(
    pages: number = 5
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (let page = 1; page <= pages; page++) {
      try {
        const tmdbResponse = await this.tmdbService.getPopularMovies(page);

        for (const tmdbMovie of tmdbResponse.results) {
          const existingMovie = await this.movieModel.findOne({
            tmdbId: tmdbMovie.id,
          });

          if (!existingMovie) {
            try {
              // Get detailed movie information
              const detailedMovie = await this.tmdbService.getMovieDetails(
                tmdbMovie.id
              );

              const movieData = {
                tmdbId: detailedMovie.id,
                title: detailedMovie.title,
                overview: detailedMovie.overview,
                releaseDate: detailedMovie.release_date
                  ? new Date(detailedMovie.release_date)
                  : undefined,
                posterPath: detailedMovie.poster_path,
                backdropPath: detailedMovie.backdrop_path,
                genres: detailedMovie.genres?.map((g) => g.name) || [],
                genreIds:
                  detailedMovie.genre_ids ||
                  detailedMovie.genres?.map((g) => g.id) ||
                  [],
                tmdbVoteAverage: detailedMovie.vote_average,
                tmdbVoteCount: detailedMovie.vote_count,
                popularity: detailedMovie.popularity,
                runtime: detailedMovie.runtime,
                budget: detailedMovie.budget,
                revenue: detailedMovie.revenue,
                originalLanguage: detailedMovie.original_language,
                userRatings: [],
                watchlistUsers: [],
                favoriteUsers: [],
              };

              await this.movieModel.create(movieData);
              imported++;
            } catch (error) {
              console.error(
                `Error importing movie ${tmdbMovie.id}:`,
                error.message
              );
              skipped++;
            }
          } else {
            skipped++;
          }
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
      }
    }

    await this.cacheManager.del("movies_list");
    return { imported, skipped };
  }
}
