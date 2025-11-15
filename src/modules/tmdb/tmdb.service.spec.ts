import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { HttpException } from "@nestjs/common";
import { TMDBService } from "./tmdb.service";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("TMDBService", () => {
  let service: TMDBService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue("mock-api-key"),
  };

  const mockTMDBMovie = {
    id: 123,
    title: "Test Movie",
    overview: "A test movie",
    release_date: "2023-01-01",
    poster_path: "/test.jpg",
    backdrop_path: "/test-backdrop.jpg",
    genre_ids: [28, 12],
    vote_average: 7.5,
    vote_count: 1000,
    popularity: 100.5,
    adult: false,
    original_language: "en",
    original_title: "Test Movie",
    video: false,
  };

  const mockTMDBResponse = {
    data: {
      results: [mockTMDBMovie],
      total_pages: 10,
      total_results: 200,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TMDBService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TMDBService>(TMDBService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should throw error if TMDB API key is not provided", () => {
    mockConfigService.get.mockReturnValue(undefined);

    expect(() => {
      new TMDBService(configService);
    }).toThrow("TMDB API key is required");
  });

  describe("getPopularMovies", () => {
    it("should fetch popular movies successfully", async () => {
      mockedAxios.get.mockResolvedValue(mockTMDBResponse);

      const result = await service.getPopularMovies(1);

      expect(result).toEqual({
        results: [mockTMDBMovie],
        total_pages: 10,
        total_results: 200,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/popular",
        {
          params: {
            api_key: "mock-api-key",
            page: 1,
          },
        }
      );
    });

    it("should handle API errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("API Error"));

      await expect(service.getPopularMovies(1)).rejects.toThrow(HttpException);
    });
  });

  describe("getMovieDetails", () => {
    it("should fetch movie details successfully", async () => {
      const mockDetailedMovie = {
        ...mockTMDBMovie,
        runtime: 120,
        budget: 1000000,
        revenue: 2000000,
        genres: [{ id: 28, name: "Action" }],
      };

      mockedAxios.get.mockResolvedValue({ data: mockDetailedMovie });

      const result = await service.getMovieDetails(123);

      expect(result).toEqual(mockDetailedMovie);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/123",
        {
          params: {
            api_key: "mock-api-key",
          },
        }
      );
    });

    it("should handle movie details API errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Movie not found"));

      await expect(service.getMovieDetails(999)).rejects.toThrow(HttpException);
    });
  });

  describe("getGenres", () => {
    it("should fetch genres successfully", async () => {
      const mockGenres = [
        { id: 28, name: "Action" },
        { id: 12, name: "Adventure" },
      ];

      mockedAxios.get.mockResolvedValue({ data: { genres: mockGenres } });

      const result = await service.getGenres();

      expect(result).toEqual(mockGenres);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/genre/movie/list",
        {
          params: {
            api_key: "mock-api-key",
          },
        }
      );
    });

    it("should handle genres API errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Genres API Error"));

      await expect(service.getGenres()).rejects.toThrow(HttpException);
    });
  });

  describe("searchMovies", () => {
    it("should search movies successfully", async () => {
      mockedAxios.get.mockResolvedValue(mockTMDBResponse);

      const result = await service.searchMovies("test", 1);

      expect(result).toEqual({
        results: [mockTMDBMovie],
        total_pages: 10,
        total_results: 200,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/search/movie",
        {
          params: {
            api_key: "mock-api-key",
            query: "test",
            page: 1,
          },
        }
      );
    });

    it("should handle search API errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Search API Error"));

      await expect(service.searchMovies("test")).rejects.toThrow(HttpException);
    });
  });

  describe("getMoviesByGenre", () => {
    it("should fetch movies by genre successfully", async () => {
      mockedAxios.get.mockResolvedValue(mockTMDBResponse);

      const result = await service.getMoviesByGenre(28, 1);

      expect(result).toEqual({
        results: [mockTMDBMovie],
        total_pages: 10,
        total_results: 200,
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/discover/movie",
        {
          params: {
            api_key: "mock-api-key",
            with_genres: 28,
            page: 1,
          },
        }
      );
    });

    it("should handle genre movies API errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Genre API Error"));

      await expect(service.getMoviesByGenre(28)).rejects.toThrow(HttpException);
    });
  });
});
