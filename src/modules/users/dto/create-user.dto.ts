import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ description: "User email" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "User name" })
  @IsString()
  name: string;
}
