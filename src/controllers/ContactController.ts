import { Request, Response } from 'express';
import { EmailService } from '../services/emailService';

export class ContactController {
  /**
   * @swagger
   * /api/contact:
   *   post:
   *     summary: Send contact form email to admin
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
   *               subject:
   *                 type: string
   *                 description: Tiêu đề email (tùy chọn)
   *                 example: "Yêu cầu tư vấn"
   *     responses:
   *       200:
   *         description: Email sent successfully
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
   *       400:
   *         description: Bad request - Missing required fields
   *       500:
   *         description: Internal server error
   */
  static async sendContactEmail(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, email, message, subject } = req.body;

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

      // Send email to admin
      await EmailService.sendContactEmailToAdmin({
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        message: message?.trim(),
        subject: subject?.trim()
      });

      // Optionally send auto-reply to user
      try {
        await EmailService.sendAutoReplyToUser(email.trim().toLowerCase(), name.trim());
      } catch (autoReplyError) {
        // Log error but don't fail the request
        console.warn('Failed to send auto-reply email:', autoReplyError);
      }

      res.status(200).json({
        success: true,
        returnCode: 200,
        message: 'Gửi thông tin liên hệ thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.'
      });
    } catch (error: any) {
      console.error('Error sending contact email:', error);
      res.status(500).json({
        success: false,
        returnCode: 500,
        message: error.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.'
      });
    }
  }
}

