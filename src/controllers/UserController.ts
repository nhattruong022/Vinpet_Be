import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import mongoose from 'mongoose';

export class UserController {
  /**
   * @swagger
   * /api/users/profile:
   *   put:
   *     summary: Update user profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *                 description: User first name
   *               lastName:
   *                 type: string
   *                 description: User last name
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email
   *               bio:
   *                 type: string
   *                 description: User biography
   *               avatar:
   *                 type: string
   *                 description: Avatar image URL
   *     responses:
   *       200:
   *         description: User profile updated successfully
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
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       409:
   *         description: Email already exists
   *       500:
   *         description: Internal server error
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const updateData = req.body;

      const user = await UserService.updateUser(userId, updateData);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: user
      });
    } catch (error: any) {
      if (error.message === 'Email already exists') {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  }
}
