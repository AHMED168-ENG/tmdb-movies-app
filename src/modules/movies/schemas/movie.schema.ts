import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type MovieDocument = Movie & Document;

@Schema({
  timestamps: true,
  collection: "movies",
})
export class Movie {
  @ApiProperty({ description: "TMDB movie ID" })
  @Prop({ required: true, unique: true })
  tmdbId: number;

  @ApiProperty({ description: "Movie title" })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: "Movie overview/description" })
  @Prop()
  overview: string;

  @ApiProperty({ description: "Movie release date" })
  @Prop()
  releaseDate: Date;

  @ApiProperty({ description: "Movie poster path" })
  @Prop()
  posterPath: string;

  @ApiProperty({ description: "Movie backdrop path" })
  @Prop()
  backdropPath: string;

  @ApiProperty({ description: "Movie genres", type: [String] })
  @Prop([String])
  genres: string[];

  @ApiProperty({ description: "Movie genre IDs", type: [Number] })
  @Prop([Number])
  genreIds: number[];

  @ApiProperty({ description: "TMDB vote average" })
  @Prop()
  tmdbVoteAverage: number;

  @ApiProperty({ description: "TMDB vote count" })
  @Prop()
  tmdbVoteCount: number;

  @ApiProperty({ description: "Movie popularity score" })
  @Prop()
  popularity: number;

  @ApiProperty({ description: "Movie runtime in minutes" })
  @Prop()
  runtime: number;

  @ApiProperty({ description: "Movie budget" })
  @Prop()
  budget: number;

  @ApiProperty({ description: "Movie revenue" })
  @Prop()
  revenue: number;

  @ApiProperty({ description: "Movie original language" })
  @Prop()
  originalLanguage: string;

  @ApiProperty({ description: "User ratings for this movie" })
  @Prop({
    type: [
      {
        userId: String,
        rating: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  userRatings: Array<{
    userId: string;
    rating: number;
    createdAt: Date;
  }>;

  @ApiProperty({ description: "Users who added this movie to watchlist" })
  @Prop({ type: [String], default: [] })
  watchlistUsers: string[];

  @ApiProperty({ description: "Users who marked this movie as favorite" })
  @Prop({ type: [String], default: [] })
  favoriteUsers: string[];

  @ApiProperty({ description: "Average user rating" })
  averageRating?: number;

  @ApiProperty({ description: "Total user ratings count" })
  ratingsCount?: number;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

// Virtual for average rating
MovieSchema.virtual("averageRating").get(function () {
  if (!this.userRatings || this.userRatings.length === 0) {
    return 0;
  }
  const sum = this.userRatings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / this.userRatings.length) * 10) / 10;
});

// Virtual for ratings count
MovieSchema.virtual("ratingsCount").get(function () {
  return this.userRatings ? this.userRatings.length : 0;
});

// Ensure virtual fields are serialized
MovieSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Index for better performance
MovieSchema.index({ tmdbId: 1 });
MovieSchema.index({ genres: 1 });
MovieSchema.index({ title: "text", overview: "text" });
