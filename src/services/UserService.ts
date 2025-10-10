import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

export class UserService {
  static async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }
} 