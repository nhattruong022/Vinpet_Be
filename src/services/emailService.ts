import nodemailer from 'nodemailer';
import path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: nodemailer.SendMailOptions['attachments'];
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      // Get email configuration from environment variables
      // Support multiple naming conventions for flexibility
      const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
      // Use EMAIL_PORT first to avoid conflict with server PORT
      const emailPort = parseInt(process.env.EMAIL_PORT || '587');
      const emailSecure = process.env.EMAIL_SECURE === 'true' || emailPort === 465;
      const emailUser = process.env.EMAIL || process.env.EMAIL_USER || '';
      const emailPassword = process.env.PASSWORD || process.env.EMAIL_PASSWORD || '';

      if (!emailUser || !emailPassword) {
        throw new Error('Email configuration is missing. Please set EMAIL (or EMAIL_USER) and PASSWORD (or EMAIL_PASSWORD) in environment variables.');
      }

      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailSecure, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });
    }

    return this.transporter;
  }

  /**
   * Send email
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = this.getTransporter();
      const fromEmail = options.from || process.env.EMAIL_FROM || process.env.EMAIL || process.env.EMAIL_USER || 'noreply@vinpet.com';

      const mailOptions = {
        from: `"Vinpet" <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
        attachments: options.attachments
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send contact form email to admin
   */
  static async sendContactEmailToAdmin(data: {
    name: string;
    phone: string;
    email: string;
    message?: string;
    subject?: string;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL || process.env.EMAIL_USER || '';
    
    if (!adminEmail) {
      throw new Error('Admin email is not configured. Please set ADMIN_EMAIL in environment variables.');
    }

    const subject = data.subject || `Liên hệ mới từ ${data.name}`;
    const logoPath = path.join(__dirname, '../public/image/logoVinpetSolution.png');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <tr>
            <td style="padding: 15px 20px; border-bottom: 3px solid #1e3a8a;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle;"><img src="cid:logo" alt="VINPET" style="height: 40px;" /></td>
                  <td style="vertical-align: middle; padding-left: 12px;"><h2 style="color: #1e3a8a; margin: 0; font-size: 18px;">Liên hệ mới từ website</h2></td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Intro -->
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 10px;">Xin chào Admin,</p>
              <p style="margin: 0;">Có một liên hệ mới từ website VINPET. Chi tiết bên dưới:</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 20px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-left: 4px solid #3b82f6;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="color: #3b82f6; font-weight: bold; margin-bottom: 15px;">Thông tin liên hệ</div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding: 8px 0; color: #6b7280; width: 110px;">Họ và tên:</td><td style="padding: 8px 0;"><strong>${data.name}</strong></td></tr>
                      <tr><td style="padding: 8px 0; color: #6b7280;">Số điện thoại:</td><td style="padding: 8px 0;">${data.phone}</td></tr>
                      <tr><td style="padding: 8px 0; color: #6b7280;">Email:</td><td style="padding: 8px 0;">${data.email}</td></tr>
                    </table>
                    ${data.message ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-left: 3px solid #3b82f6; margin-top: 15px;">
                      <tr>
                        <td style="padding: 15px;">
                          <strong>Nội dung tin nhắn:</strong><br/>
                          <span style="white-space: pre-wrap;">${data.message}</span>
                        </td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 15px 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;">
              Email tự động từ VINPET • ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
Liên hệ mới từ website

Họ và tên: ${data.name}
Số điện thoại: ${data.phone}
Email: ${data.email}
${data.message ? `\nNội dung tin nhắn:\n${data.message}` : ''}

Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: subject,
      html: html,
      text: text,
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo'
      }]
    });
  }

  /**
   * Send auto-reply email to user
   */
  static async sendAutoReplyToUser(userEmail: string, userName: string): Promise<void> {
    const logoPath = path.join(__dirname, '../public/image/logoVinpetSolution.png');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: white; padding: 20px; text-align: center; border-bottom: 3px solid #1e3a8a; }
          .header img { height: 50px; margin-bottom: 10px; }
          .header h2 { color: #1e3a8a; margin: 0; }
          .content { padding: 25px 20px; background: #f9fafb; border-left: 4px solid #3b82f6; margin: 20px; }
          .footer { padding: 15px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="cid:logo" alt="VINPET" />
          <h2>Cảm ơn bạn đã liên hệ!</h2>
        </div>
        <div class="content">
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Chúng tôi đã nhận được thông tin liên hệ của bạn. Đội ngũ VINPET sẽ phản hồi trong thời gian sớm nhất.</p>
          <p>Trân trọng,<br/><strong>Đội ngũ VINPET</strong></p>
        </div>
        <div class="footer">
          Email tự động từ VINPET
        </div>
      </body>
      </html>
    `;

    const text = `
Cảm ơn bạn đã liên hệ!

Xin chào ${userName},

Chúng tôi đã nhận được thông tin liên hệ của bạn. Đội ngũ của chúng tôi sẽ phản hồi trong thời gian sớm nhất.

Trân trọng,
Đội ngũ Vinpet
    `;

    await this.sendEmail({
      to: userEmail,
      subject: 'Cảm ơn bạn đã liên hệ với Vinpet',
      html: html,
      text: text,
      attachments: [{
        filename: 'logo.png',
        path: logoPath,
        
        cid: 'logo'
      }]
    });
  }
}

