import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { register, login, getMe } from '../controllers/authController';
import User from '../models/User';

// Mock User Model
vi.mock('../models/User', () => {
  const MockModel = {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  };

  return {
    default: MockModel,
  };
});

// Mock generateToken
vi.mock('../utils/generateToken', () => ({
  generateToken: vi.fn().mockReturnValue('mocktoken123'),
}));

describe('Auth Controller Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('register', () => {
    it('should register a new user successfully and return user data and token', async () => {
      req = {
        body: {
          name: 'Test Cashier',
          email: 'cashier@test.com',
          password: 'password123',
          role: 'cashier',
        },
      };

      const mockFindOne = User.findOne as any;
      mockFindOne.mockResolvedValue(null);

      const mockCreate = User.create as any;
      mockCreate.mockResolvedValue({
        _id: 'mockuserid123',
        name: 'Test Cashier',
        email: 'cashier@test.com',
        role: 'cashier',
      });

      await register(req as Request, res as Response);

      expect(mockFindOne).toHaveBeenCalledWith({ email: 'cashier@test.com' });
      expect(mockCreate).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'mockuserid123',
          name: 'Test Cashier',
          email: 'cashier@test.com',
          role: 'cashier',
          token: 'mocktoken123',
        })
      );
    });

    it('should fail registration if email is already taken', async () => {
      req = {
        body: {
          name: 'Test Cashier',
          email: 'cashier@test.com',
          password: 'password123',
        },
      };

      const mockFindOne = User.findOne as any;
      mockFindOne.mockResolvedValue({ _id: 'someid' });

      await register(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User already exists' });
    });

    it('should fail registration for password less than 6 characters', async () => {
      req = {
        body: {
          name: 'Test Cashier',
          email: 'cashier@test.com',
          password: '123',
        },
      };

      await register(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      req = {
        body: {
          email: 'cashier@test.com',
          password: 'password123',
        },
      };

      const mockMatchPassword = vi.fn().mockResolvedValue(true);
      const mockFindOne = User.findOne as any;
      mockFindOne.mockResolvedValue({
        _id: 'mockuserid123',
        name: 'Test Cashier',
        email: 'cashier@test.com',
        role: 'cashier',
        matchPassword: mockMatchPassword,
      });

      await login(req as Request, res as Response);

      expect(mockFindOne).toHaveBeenCalledWith({ email: 'cashier@test.com' });
      expect(mockMatchPassword).toHaveBeenCalledWith('password123');
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'mockuserid123',
          name: 'Test Cashier',
          email: 'cashier@test.com',
          role: 'cashier',
          token: 'mocktoken123',
        })
      );
    });

    it('should fail login with wrong password', async () => {
      req = {
        body: {
          email: 'cashier@test.com',
          password: 'wrongpassword',
        },
      };

      const mockMatchPassword = vi.fn().mockResolvedValue(false);
      const mockFindOne = User.findOne as any;
      mockFindOne.mockResolvedValue({
        _id: 'mockuserid123',
        email: 'cashier@test.com',
        matchPassword: mockMatchPassword,
      });

      await login(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });
  });

  describe('getMe', () => {
    it('should return profile information if user is attached to request', async () => {
      req = {
        user: {
          _id: 'mockuserid123',
          name: 'Test Cashier',
          email: 'cashier@test.com',
          role: 'cashier',
        } as any,
      };

      await getMe(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'mockuserid123',
          name: 'Test Cashier',
          email: 'cashier@test.com',
          role: 'cashier',
        })
      );
    });

    it('should fail if user is not attached to request', async () => {
      req = {};

      await getMe(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Not authorized' });
    });
  });
});
