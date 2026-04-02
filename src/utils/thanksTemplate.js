/** @format */

export const thankYouContactTemplate = (receiverEmail, link) => {
  return {
    to: receiverEmail,
    subject: `Message Received – Thank You!`,
    from: `Tuyikunde Jackson Portfolio <${process.env.SMTP_GMAIL_SENDER_EMAIL}>`,
    text: 'Thank you for contacting me. Your message has been received.',
    html: `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" 
        style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" 
              style="background-color: #111827; border-radius: 20px; overflow: hidden; font-family: Arial, sans-serif; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 25px; background: linear-gradient(90deg, #2563EB, #3B82F6);">
                  <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; letter-spacing: 1px;">
                    JACKSON PORTFOLIO
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 35px; text-align: center;">
                  <h2 style="color: #3B82F6; margin-bottom: 15px; font-size: 26px;">
                    Thank You for Reaching Out 🚀
                  </h2>

                  <p style="color: #CBD5E1; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">
                    Your message has been successfully received.  
                    I truly appreciate your interest and will respond to you as soon as possible.
                  </p>

                  <p style="color: #94A3B8; font-size: 14px; margin-bottom: 30px;">
                    In the meantime, feel free to explore more of my work and projects.
                  </p>

                  <!-- Button -->
                  <a href="${link}" 
                    style="background: linear-gradient(90deg, #2563EB, #3B82F6); 
                           color: #FFFFFF; 
                           padding: 14px 32px; 
                           text-decoration: none; 
                           border-radius: 50px; 
                           font-weight: bold; 
                           font-size: 14px; 
                           display: inline-block;">
                    Explore My Portfolio
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding: 25px; background-color: #0F172A; border-top: 1px solid #1E293B;">
                  <p style="color: #64748B; font-size: 13px; margin: 5px 0;">
                    📩 Contact: 
                    <a href="mailto:tuyikundejackson74@email.com" 
                       style="color: #3B82F6; text-decoration: none;">
                      tuyikundejackson74@email.com
                    </a>
                  </p>

                  <p style="color: #475569; font-size: 11px; margin-top: 10px;">
                    © 2026 Jackson Portfolio. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    `
  };
};