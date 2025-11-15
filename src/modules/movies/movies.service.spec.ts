import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { MoviesService } from "./movies.service";
import { Movie, MovieDocument } from "./schemas/movie.schema";
import { TMDBService } from "../tmdb/tmdb.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import {
  CreateMovieDto,
  UpdateMovieDto,
  RateMovieDto,
  MovieFilterDto,
} from "./dto/movie.dto";

describe("MoviesService", () => {
  let service: MoviesService;
  let model: Model<MovieDocument>;
  let tmdbService: TMDBService;
  let cacheManager: Cache;

  const mockMovie = {
    _id: "507f1f77bcf86cd799439011",
    tmdbId: 123,
    title: "Test Movie",
    overview: "A test movie overview",
    releaseDate: new Date("2023-01-01"),
    posterPath: "/test.jpg",
    backdropPath: "/backdrop.jpg",
    genres: ["Action", "Adventure"],
    genreIds: [28, 12],
    tmdbVoteAverage: 7.5,
    tmdbVoteCount: 1000,
    popularity: 100.5,
    runtime: 120,
    budget: 1000000,
    revenue: 2000000,
    originalLanguage: "en",
    userRatings: [
      { userId: "user1", rating: 8, createdAt: new Date() },
      { userId: "user2", rating: 9, createdAt: new Date() },
    ],
    watchlistUsers: ["user1"],
    favoriteUsers: ["user2"],
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockMovieModel = {
    new: jest.fn().mockResolvedValue(mockMovie),
    constructor: jest.fn().mockResolvedValue(mockMovie),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  const mockTMDBService = {
    getPopularMovies: jest.fn(),
    getMovieDetails: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getModelToken(Movie.name),
          useValue: mockMovieModel,
        },
        {
          provide: TMDBService,
          useValue: mockTMDBService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    model = module.get<Model<MovieDocument>>(getModelToken(Movie.name));
    tmdbService = module.get<TMDBService>(TMDBService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new movie", async () => {
      const createMovieDto: CreateMovieDto = {
        tmdbId: 123,
        title: "Test Movie",
        overview: "A test movie",
      };

      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const saveMock = jest.fn().mockResolvedValue(mockMovie);
      mockMovieModel.constructor.mockImplementation(() => ({
        ...mockMovie,
        save: saveMock,
      }));

      jest.spyOn(model, "findOne").mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const newMovie = new model(createMovieDto);
      jest.spyOn(newMovie, "save").mockResolvedValue(mockMovie as any);

      const result = await service.create(createMovieDto);

      expect(mockCacheManager.del).toHaveBeenCalledWith("movies_list");
    });

    it("should throw BadRequestException if movie already exists", async () => {
      const createMovieDto: CreateMovieDto = {
        tmdbId: 123,
        title: "Test Movie",
      };

      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovie),
      });

      await expect(service.create(createMovieDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated movies", async () => {
      const filterDto: MovieFilterDto = {
        page: 1,
        limit: 20,
      };

      const movies = [mockMovie];
      const total = 1;

      mockCacheManager.get.mockResolvedValue(null);
      mockMovieModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(movies),
      });
      mockMovieModel.countDocuments.mockResolvedValue(total);

      const result = await service.findAll(filterDto);

      expect(result.data).toBeDefined();
      expect(result.total).toBe(total);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it("should return cached data if available", async () => {
      const filterDto: MovieFilterDto = {
        page: 1,
        limit: 20,
      };

      const cachedData = {
        data: [mockMovie],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.findAll(filterDto);

      expect(result).toEqual(cachedData);
      expect(mockMovieModel.find).not.toHaveBeenCalled();
    });

    it("should filter by genre", async () => {
      const filterDto: MovieFilterDto = {
        page: 1,
        limit: 20,
        genre: "Action",
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockMovieModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockMovie]),
      });
      mockMovieModel.countDocuments.mockResolvedValue(1);

      await service.findAll(filterDto);

      expect(mockMovieModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          genres: { $in: ["Action"] },
        })
      );
    });

    it("should search in title and overview", async () => {
      const filterDto: MovieFilterDto = {
        page: 1,
        limit: 20,
        search: "test",
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockMovieModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockMovie]),
      });
      mockMovieModel.countDocuments.mockResolvedValue(1);

      await service.findAll(filterDto);

      expect(mockMovieModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $text: { $search: "test" },
        })
      );
    });
  });

  describe("findOne", () => {
    it("should return a movie by id", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockCacheManager.get.mockResolvedValue(null);
      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovie),
      });

      const result = await service.findOne(id);

      expect(result).toBeDefined();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it("should return cached movie if available", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockCacheManager.get.mockResolvedValue(mockMovie);

      const result = await service.findOne(id);

      expect(result).toEqual(mockMovie);
      expect(mockMovieModel.findById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if movie not found", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockCacheManager.get.mockResolvedValue(null);
      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByTmdbId", () => {
    it("should return a movie by TMDB ID", async () => {
      const tmdbId = 123;

      mockCacheManager.get.mockResolvedValue(null);
      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovie),
      });

      const result = await service.findByTmdbId(tmdbId);

      expect(result).toBeDefined();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it("should throw NotFoundException if movie not found", async () => {
      const tmdbId = 999;

      mockCacheManager.get.mockResolvedValue(null);
      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByTmdbId(tmdbId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    it("should update a movie", async () => {
      const id = "507f1f77bcf86cd799439011";
      const updateDto: UpdateMovieDto = {
        title: "Updated Title",
      };

      mockMovieModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockMovie, ...updateDto }),
      });

      const result = await service.update(id, updateDto);

      expect(result).toBeDefined();
      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
    });

    it("should throw NotFoundException if movie not found", async () => {
      const id = "507f1f77bcf86cd799439011";
      const updateDto: UpdateMovieDto = {
        title: "Updated Title",
      };

      mockMovieModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("remove", () => {
    it("should delete a movie", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockMovieModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovie),
      });

      await service.remove(id);

      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
    });

    it("should throw NotFoundException if movie not found", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockMovieModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe("rateMovie", () => {
    it("should add a new rating", async () => {
      const id = "507f1f77bcf86cd799439011";
      const rateDto: RateMovieDto = {
        userId: "user3",
        rating: 7,
      };

      const movieWithRatings = {
        ...mockMovie,
        userRatings: [...mockMovie.userRatings],
        save: jest.fn().mockResolvedValue(mockMovie),
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(movieWithRatings),
      });

      const result = await service.rateMovie(id, rateDto);

      expect(movieWithRatings.save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
    });

    it("should update existing rating", async () => {
      const id = "507f1f77bcf86cd799439011";
      const rateDto: RateMovieDto = {
        userId: "user1",
        rating: 10,
      };

      const movieWithRatings = {
        ...mockMovie,
        userRatings: [...mockMovie.userRatings],
        save: jest.fn().mockResolvedValue(mockMovie),
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(movieWithRatings),
      });

      await service.rateMovie(id, rateDto);

      expect(movieWithRatings.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if movie not found", async () => {
      const id = "507f1f77bcf86cd799439011";
      const rateDto: RateMovieDto = {
        userId: "user1",
        rating: 8,
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.rateMovie(id, rateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("addToWatchlist", () => {
    it("should add movie to watchlist", async () => {
      const id = "507f1f77bcf86cd799439011";
      const userId = "user3";

      const movieWithWatchlist = {
        ...mockMovie,
        watchlistUsers: [...mockMovie.watchlistUsers],
        save: jest.fn().mockResolvedValue(mockMovie),
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(movieWithWatchlist),
      });

      await service.addToWatchlist(id, userId);

      expect(movieWithWatchlist.save).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
    });

    it("should not add duplicate to watchlist", async () => {
      const id = "507f1f77bcf86cd799439011";
      const userId = "user1"; // already in watchlist

      const movieWithWatchlist = {
        ...mockMovie,
        watchlistUsers: [...mockMovie.watchlistUsers],
        save: jest.fn().mockResolvedValue(mockMovie),
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(movieWithWatchlist),
      });

      await service.addToWatchlist(id, userId);

      expect(movieWithWatchlist.save).not.toHaveBeenCalled();
    });
  });

  describe("removeFromWatchlist", () => {
    it("should remove movie from watchlist", async () => {
      const id = "507f1f77bcf86cd799439011";
      const userId = "user1";

      const movieWithWatchlist = {
        ...mockMovie,
        watchlistUsers: [...mockMovie.watchlistUsers],
        save: jest.fn().mockResolvedValue(mockMovie),
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(movieWithWatchlist),
      });

      await service.removeFromWatchlist(id, userId);

      expect(movieWithWatchlist.save).toHaveBeenCalled();
    });
  });

  describe("addToFavorites", () => {
    it("should add movie to favorites", async () => {
      const id = "507f1f77bcf86cd799439011";
      const userId = "user3";

      const movieWithFavorites = {
        ...mockMovie,
        favoriteUsers: [...mockMovie.favoriteUsers],
        save: jest.fn().mockResolvedValue(mockMovie),
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(movieWithFavorites),
      });

      await service.addToFavorites(id, userId);

      expect(movieWithFavorites.save).toHaveBeenCalled();
    });
  });

  describe("removeFromFavorites", () => {
    it("should remove movie from favorites", async () => {
      const id = "507f1f77bcf86cd799439011";
      const userId = "user2";

      const movieWithFavorites = {
        ...mockMovie,
        favoriteUsers: [...mockMovie.favoriteUsers],
        save: jest.fn().mockResolvedValue(mockMovie),
      };

      mockMovieModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(movieWithFavorites),
      });

      await service.removeFromFavorites(id, userId);

      expect(movieWithFavorites.save).toHaveBeenCalled();
    });
  });

  describe("syncFromTMDB", () => {
    it("should sync movies from TMDB", async () => {
      const mockTMDBMovies = {
        results: [
          { id: 1, title: "Movie 1" },
          { id: 2, title: "Movie 2" },
        ],
      };

      const mockDetailedMovie = {
        id: 1,
        title: "Movie 1",
        overview: "Overview",
        release_date: "2023-01-01",
        poster_path: "/poster.jpg",
        backdrop_path: "/backdrop.jpg",
        genres: [{ id: 28, name: "Action" }],
        vote_average: 7.5,
        vote_count: 1000,
        popularity: 100,
        runtime: 120,
        budget: 1000000,
        revenue: 2000000,
        original_language: "en",
      };

      mockTMDBService.getPopularMovies.mockResolvedValue(mockTMDBMovies);
      mockTMDBService.getMovieDetails.mockResolvedValue(mockDetailedMovie);
      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockMovieModel.create.mockResolvedValue(mockMovie);

      const result = await service.syncFromTMDB(1);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockTMDBService.getPopularMovies).toHaveBeenCalledWith(1);
      expect(mockCacheManager.del).toHaveBeenCalledWith("movies_list");
    });

    it("should skip existing movies", async () => {
      const mockTMDBMovies = {
        results: [{ id: 123, title: "Existing Movie" }],
      };

      mockTMDBService.getPopularMovies.mockResolvedValue(mockTMDBMovies);
      mockMovieModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMovie),
      });

      const result = await service.syncFromTMDB(1);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });
});
