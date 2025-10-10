import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 description: User password
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                       properties:
   *                         _id:
   *                           type: string
   *                         email:
   *                           type: string
   *                         createdAt:
   *                           type: string
   *       400:
   *         description: Bad request
   *       409:
   *         description: User already exists
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
        return;
      }

      // Register user
      const user = await AuthService.register(email, password);

      // No cookie needed for register

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            createdAt: user.createdAt
          }
        }
      });
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email
   *               password:
   *                 type: string
   *                 description: User password
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       type: object
   *                       properties:
   *                         _id:
   *                           type: string
   *                         email:
   *                           type: string
   *                     token:
   *                       type: string
   *       400:
   *         description: Bad request
   *       401:
   *         description: Invalid credentials
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Login user
      const { user, token } = await AuthService.login(email, password);

      // No cookie needed for login

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            _id: user._id,
            email: user.email
          },
          token
        }
      });
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token from storage. However, we can provide
      // server-side validation and response.
      
      // Optional: You could implement token blacklisting here
      // by storing invalidated tokens in a database or cache
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
