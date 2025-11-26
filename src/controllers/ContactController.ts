import { Request, Response } from 'express';
import { ContactService } from '../services/ContactService';
import { EmailService } from '../services/emailService';

export class ContactController {
  /**
   * @swagger
   * /api/contact:
   *   post:
   *     summary: Save contact form to database
   *     tags: [Contact]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - phone
   *               - email
   *             properties:
   *               name:
   *                 type: string
   *                 description: Họ và tên
   *                 example: "Nguyễn Văn A"
   *               phone:
   *                 type: string
   *                 description: Số điện thoại
   *                 example: "0901234567"
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email
   *                 example: "nguyenvana@example.com"
   *               message:
   *                 type: string
   *                 description: Nội dung tin nhắn (tùy chọn)
   *                 example: "Tôi muốn tư vấn về sản phẩm"
   *     responses:
   *       201:
   *         description: Contact saved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 returnCode:
   *                   type: integer
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     _id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     phone:
   *                       type: string
   *                     email:
   *                       type: string
   *                     message:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Bad request - Missing required fields
   *       500:
   *         description: Internal server error
   */
  static async createContact(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, email, message } = req.body;

      // Validate required fields
      if (!name || !phone || !email) {
        res.status(400).json({
          success: false,
          returnCode: 400,
          message: 'Vui lòng điền đầy đủ thông tin: họ tên, số điện thoại và email'
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          returnCode: 400,
          message: 'Email không hợp lệ'
        });
        return;
      }

      // Validate phone format (Vietnamese phone numbers)
      const phoneRegex = /^(0|\+84)[1-9][0-9]{8,9}$/;
      const cleanPhone = phone.replace(/\s+/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        res.status(400).json({
          success: false,
          returnCode: 400,
          message: 'Số điện thoại không hợp lệ'
        });
        return;
      }

      // Save contact to database
      const contact = await ContactService.createContact({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        message: message?.trim()
      });

      // Send email notifications (non-blocking)
      const contactData = {
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        message: message?.trim()
      };
      
      Promise.all([
        EmailService.sendContactEmailToAdmin(contactData),
        EmailService.sendAutoReplyToUser(contactData.email, contactData.name)
      ]).catch(err => console.error('Error sending contact emails:', err));

      res.status(201).json({
        success: true,
        returnCode: 201,
        message: 'Lưu thông tin liên hệ thành công',
        data: contact
      });
    } catch (error: any) {
      console.error('Error saving contact:', error);
      res.status(500).json({
        success: false,
        returnCode: 500,
        message: error.message || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.'
      });
    }
  }

  /**
   * @swagger
   * /api/contact:
   *   get:
   *     summary: Get all contacts with pagination
   *     tags: [Contact]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contacts retrieved successfully
   */
  static async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        pageSize = 10,
        search
      } = req.query;

      const result = await ContactService.getContacts({
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        search: search as string
      });

      res.status(200).json({
        success: true,
        returnCode: 200,
        message: 'Contacts retrieved successfully',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        returnCode: 500,
        message: error.message
      });
    }
  }

}

