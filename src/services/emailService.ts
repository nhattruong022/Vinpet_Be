import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
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
      const emailHost = process.env.EMAIL_HOST || process.env.HOST || 'smtp.gmail.com';
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
        html: options.html || options.text
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
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4a5568;
            color: white;
            padding: 20px;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f7fafc;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .info-row {
            margin-bottom: 15px;
            padding: 10px;
            background-color: white;
            border-left: 3px solid #4299e1;
          }
          .label {
            font-weight: bold;
            color: #2d3748;
            display: inline-block;
            min-width: 120px;
          }
          .value {
            color: #4a5568;
          }
          .message-box {
            margin-top: 20px;
            padding: 15px;
            background-color: white;
            border-left: 3px solid #48bb78;
            border-radius: 3px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>📧 Liên hệ mới từ website</h2>
        </div>
        <div class="content">
          <div class="info-row">
            <span class="label">Họ và tên:</span>
            <span class="value">${data.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Số điện thoại:</span>
            <span class="value">${data.phone}</span>
          </div>
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">${data.email}</span>
          </div>
          ${data.message ? `
          <div class="message-box">
            <div class="label" style="display: block; margin-bottom: 10px;">Nội dung tin nhắn:</div>
            <div class="value" style="white-space: pre-wrap;">${data.message}</div>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống Vinpet</p>
          <p>Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
        </div>
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
      text: text
    });
  }

  /**
   * Send auto-reply email to user
   */
  static async sendAutoReplyToUser(userEmail: string, userName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4299e1;
            color: white;
            padding: 20px;
            border-radius: 5px 5px 0 0;
            text-align: center;
          }
          .content {
            background-color: #f7fafc;
            padding: 30px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #718096;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>✅ Cảm ơn bạn đã liên hệ!</h2>
        </div>
        <div class="content">
          <p>Xin chào <strong>${userName}</strong>,</p>
          <p>Chúng tôi đã nhận được thông tin liên hệ của bạn. Đội ngũ của chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
          <p>Trân trọng,<br><strong>Đội ngũ Vinpet</strong></p>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động từ hệ thống Vinpet</p>
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
      text: text
    });
  }
}

