import * as nodemailer from 'nodemailer';
import * as cors from 'cors';

cors({ origin: true });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface MailerOptions {
  to: string;
  subject: string;
  text: string;
}

export const mailer = async ({
  to,
  subject,
  text,
}: MailerOptions): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: `Fat Buck Functions <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      text,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      console.log('Email sent successfully.');
      resolve(true);
    });
  });
};
