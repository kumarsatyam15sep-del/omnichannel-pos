import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import User from '../models/User';
import jwt from 'jsonwebtoken';

vi.mock('../models/User', () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => {
  const verifyMock = vi.fn();
  return {
    default: {
      verify: verifyMock,
    },
    verify: verifyMock,
  };
});

describe('Middleware Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
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
    next = vi.fn();
  });

  describe('protect authMiddleware', () => {
    it('should authenticate user with valid Bearer token', async () => {
      req = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };

      const mockVerify = jwt.verify as any;
      mockVerify.mockReturnValue({ id: 'userid123', role: 'cashier' });

      const mockFindById = User.findById as any;
      mockFindById.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: 'userid123',
          name: 'Test Cashier',
          role: 'cashier',
        }),
      });

      await protect(req as Request, res as Response, next);

      expect(mockVerify).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.name).toBe('Test Cashier');
    });

    it('should fail with 401 if no authorization header', async () => {
      req = {
        headers: {},
      };

      await protect(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Not authorized, no token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail with 401 if invalid token', async () => {
      req = {
        headers: {
          authorization: 'Bearer invalid_token',
        },
      };

      const mockVerify = jwt.verify as any;
      mockVerify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await protect(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize roleMiddleware', () => {
    it('should allow request to proceed if user has authorized role', () => {
      req = {
        user: {
          role: 'admin',
        } as any,
      };

      const checkRole = authorize(['admin', 'manager']);
      checkRole(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should block and return 403 if user has unauthorized role', () => {
      req = {
        user: {
          role: 'cashier',
        } as any,
      };

      const checkRole = authorize(['admin', 'manager']);
      checkRole(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Forbidden: access denied' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
