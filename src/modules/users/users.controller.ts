import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schemas/user.schema';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ApiResponseDto } from '../../common/dto/response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User with this email already exists',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<User>> {
    const user = await this.usersService.create(createUserDto);
    return new ApiResponseDto(true, 'User created successfully', user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [User],
  })
  async findAll(): Promise<ApiResponseDto<User[]>> {
    const users = await this.usersService.findAll();
    return new ApiResponseDto(true, 'Users retrieved successfully', users);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<User>> {
    const user = await this.usersService.findOne(id);
    return new ApiResponseDto(true, 'User retrieved successfully', user);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get a user by email' })
  @ApiParam({ name: 'email', description: 'User email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findByEmail(@Param('email') email: string): Promise<ApiResponseDto<User>> {
    const user = await this.usersService.findByEmail(email);
    return new ApiResponseDto(true, 'User retrieved successfully', user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async update(@Param('id') id: string, @Body() updateData: Partial<CreateUserDto>): Promise<ApiResponseDto<User>> {
    const user = await this.usersService.update(id, updateData);
    return new ApiResponseDto(true, 'User updated successfully', user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.usersService.remove(id);
    return new ApiResponseDto(true, 'User deleted successfully');
  }
}