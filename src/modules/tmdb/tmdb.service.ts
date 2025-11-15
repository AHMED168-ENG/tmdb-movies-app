import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosResponse } from "axios";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  original_title: string;
  video: boolean;
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  budget: number;
  revenue: number;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string;
    origin_country: string;
  }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{
    english_name: string;
    iso_639_1: string;
    name: string;
  }>;
  status: string;
  tagline: string;
  homepage: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

@Injectable()
export class TMDBService {
  private readonly baseUrl = "https://api.themoviedb.org/3";
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("TMDB_API_KEY");
    if (!this.apiKey) {
      throw new Error("TMDB API key is required");
    }
  }

  async getPopularMovies(page: number = 1): Promise<{
    results: TMDBMovie[];
    total_pages: number;
    total_results: number;
  }> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/movie/popular`,
        {
          params: {
            api_key: this.apiKey,
            page,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        "Failed to fetch popular movies from TMDB",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/movie/${movieId}`,
        {
          params: {
            api_key: this.apiKey,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch movie details for ID ${movieId}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getGenres(): Promise<TMDBGenre[]> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/genre/movie/list`,
        {
          params: {
            api_key: this.apiKey,
          },
        }
      );
      return response.data.genres;
    } catch (error) {
      throw new HttpException(
        "Failed to fetch genres from TMDB",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async searchMovies(
    query: string,
    page: number = 1
  ): Promise<{
    results: TMDBMovie[];
    total_pages: number;
    total_results: number;
  }> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/search/movie`,
        {
          params: {
            api_key: this.apiKey,
            query,
            page,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        "Failed to search movies from TMDB",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async getMoviesByGenre(
    genreId: number,
    page: number = 1
  ): Promise<{
    results: TMDBMovie[];
    total_pages: number;
    total_results: number;
  }> {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/discover/movie`,
        {
          params: {
            api_key: this.apiKey,
            with_genres: genreId,
            page,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        "Failed to fetch movies by genre from TMDB",
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
