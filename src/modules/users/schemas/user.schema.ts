import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: "users",
})
export class User {
  @ApiProperty({ description: "User email" })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: "User name" })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: "User watchlist movie IDs" })
  @Prop({ type: [String], default: [] })
  watchlist: string[];

  @ApiProperty({ description: "User favorite movie IDs" })
  @Prop({ type: [String], default: [] })
  favorites: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for better performance
UserSchema.index({ email: 1 });

UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
