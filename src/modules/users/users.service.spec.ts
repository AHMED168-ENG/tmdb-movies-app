import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UsersService } from "./users.service";
import { User, UserDocument } from "./schemas/user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("UsersService", () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    email: "test@example.com",
    name: "Test User",
    watchlist: ["movie1", "movie2"],
    favorites: ["movie3"],
    save: jest.fn().mockResolvedValue(this),
  };

  const mockUserModel = {
    new: jest.fn().mockResolvedValue(mockUser),
    constructor: jest.fn().mockResolvedValue(mockUser),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createUserDto: CreateUserDto = {
        email: "newuser@example.com",
        name: "New User",
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const saveMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.constructor.mockImplementation(() => ({
        ...mockUser,
        save: saveMock,
      }));

      jest.spyOn(model, "findOne").mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const newUser = new model(createUserDto);
      jest.spyOn(newUser, "save").mockResolvedValue(mockUser as any);

      const result = await service.create(createUserDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
    });

    it("should throw BadRequestException if user already exists", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@example.com",
        name: "Test User",
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        "User with this email already exists"
      );
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      const users = [mockUser];

      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(users),
      });

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUserModel.find).toHaveBeenCalled();
    });

    it("should return empty array if no users exist", async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should return a user by ID", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOne(id);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(id);
    });

    it("should throw NotFoundException if user not found", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(id)).rejects.toThrow(
        `User with ID "${id}" not found`
      );
    });
  });

  describe("findByEmail", () => {
    it("should return a user by email", async () => {
      const email = "test@example.com";

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
    });

    it("should throw NotFoundException if user not found", async () => {
      const email = "nonexistent@example.com";

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByEmail(email)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findByEmail(email)).rejects.toThrow(
        `User with email "${email}" not found`
      );
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const id = "507f1f77bcf86cd799439011";
      const updateData: Partial<CreateUserDto> = {
        name: "Updated Name",
      };

      const updatedUser = { ...mockUser, ...updateData };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update(id, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        updateData,
        { new: true }
      );
    });

    it("should throw NotFoundException if user not found", async () => {
      const id = "507f1f77bcf86cd799439011";
      const updateData: Partial<CreateUserDto> = {
        name: "Updated Name",
      };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(id, updateData)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should update user email", async () => {
      const id = "507f1f77bcf86cd799439011";
      const updateData: Partial<CreateUserDto> = {
        email: "newemail@example.com",
      };

      const updatedUser = { ...mockUser, ...updateData };

      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update(id, updateData);

      expect(result.email).toBe("newemail@example.com");
    });
  });

  describe("remove", () => {
    it("should delete a user", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.remove(id);

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it("should throw NotFoundException if user not found", async () => {
      const id = "507f1f77bcf86cd799439011";

      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe("addToWatchlist", () => {
    it("should add movie to user watchlist", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie123";

      const userWithWatchlist = {
        ...mockUser,
        watchlist: [...mockUser.watchlist],
        save: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithWatchlist),
      });

      const result = await service.addToWatchlist(userId, movieId);

      expect(userWithWatchlist.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should not add duplicate to watchlist", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie1"; // already in watchlist

      const userWithWatchlist = {
        ...mockUser,
        watchlist: [...mockUser.watchlist],
        save: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithWatchlist),
      });

      await service.addToWatchlist(userId, movieId);

      expect(userWithWatchlist.save).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie123";

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.addToWatchlist(userId, movieId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("removeFromWatchlist", () => {
    it("should remove movie from user watchlist", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie1";

      const userWithWatchlist = {
        ...mockUser,
        watchlist: [...mockUser.watchlist],
        save: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithWatchlist),
      });

      const result = await service.removeFromWatchlist(userId, movieId);

      expect(userWithWatchlist.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException if user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie1";

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.removeFromWatchlist(userId, movieId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("addToFavorites", () => {
    it("should add movie to user favorites", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie456";

      const userWithFavorites = {
        ...mockUser,
        favorites: [...mockUser.favorites],
        save: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithFavorites),
      });

      const result = await service.addToFavorites(userId, movieId);

      expect(userWithFavorites.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should not add duplicate to favorites", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie3"; // already in favorites

      const userWithFavorites = {
        ...mockUser,
        favorites: [...mockUser.favorites],
        save: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithFavorites),
      });

      await service.addToFavorites(userId, movieId);

      expect(userWithFavorites.save).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie456";

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.addToFavorites(userId, movieId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("removeFromFavorites", () => {
    it("should remove movie from user favorites", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie3";

      const userWithFavorites = {
        ...mockUser,
        favorites: [...mockUser.favorites],
        save: jest.fn().mockResolvedValue(mockUser),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithFavorites),
      });

      const result = await service.removeFromFavorites(userId, movieId);

      expect(userWithFavorites.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException if user not found", async () => {
      const userId = "507f1f77bcf86cd799439011";
      const movieId = "movie3";

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.removeFromFavorites(userId, movieId)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
