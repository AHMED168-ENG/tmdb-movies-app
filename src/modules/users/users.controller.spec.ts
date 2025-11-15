import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ApiResponseDto } from '../../common/dto/response.dto';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    watchlist: [],
    favorites: [],
  };

  const mockUsersService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue(undefined),
    addToWatchlist: jest.fn().mockResolvedValue({
      ...mockUser,
      watchlist: ['movie123'],
    }),
    removeFromWatchlist: jest.fn().mockResolvedValue(mockUser),
    addToFavorites: jest.fn().mockResolvedValue({
      ...mockUser,
      favorites: ['movie123'],
    }),
    removeFromFavorites: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await controller.create(createUserDto);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User created successfully');
      expect(result.data).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const result = await controller.findAll();

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Users retrieved successfully');
      expect(result.data).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const id = '507f1f77bcf86cd799439011';
      const result = await controller.findOne(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User retrieved successfully');
      expect(result.data).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const result = await controller.findByEmail(email);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User retrieved successfully');
      expect(result.data).toEqual(mockUser);
      expect(service.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated User' };
      const result = await controller.update(id, updateData);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User updated successfully');
      expect(result.data).toEqual(mockUser);
      expect(service.update).toHaveBeenCalledWith(id, updateData);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const id = '507f1f77bcf86cd799439011';
      const result = await controller.remove(id);

      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.success).toBe(true);
      expect(result.message).toBe('User deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });
});