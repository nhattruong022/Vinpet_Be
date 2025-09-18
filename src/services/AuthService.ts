import { User, IUser } from '../models/User';
import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Register a new user (without JWT)
   */
  static async register(email: string, password: string): Promise<IUser> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user with passwordOrigin
      const user = new User({
        email,
        password,
        passwordOrigin: password // Store original password without encryption
      });
      await user.save();

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user and generate JWT
   */
  static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const payload = { userId: user._id, email: user.email };
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const options: jwt.SignOptions = { expiresIn: '7d' };

      const token = jwt.sign(payload, secret, options);

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }
}