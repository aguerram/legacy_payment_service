import { Injectable } from '@nestjs/common';
const mailchimp = require('@mailchimp/mailchimp_transactional')(process.env.MANDRILL_API_KEY);

@Injectable()
export class MailingService {
  mandrill_client: any;
  from_email = 'notifier@dibsy.one';
  from_name = 'Dibsy Notifier';
  reply_to_email = 'notifier@dibsy.one';


  sendMessage(emailTo, nameTo, subject, contentHtml,from_email=null,from_name=null): Promise<any> {
    let message = {
      html: contentHtml,
      text: contentHtml,
      subject: subject,
      from_email: from_email ? from_email: this.from_email,
      from_name: from_name?from_name:this.from_name,
      to: [
        {
          email: emailTo,
          name: nameTo,
          type: 'to',
        },
      ],
      headers: {
        'Reply-To': this.reply_to_email,
      },
      important: true,
    };
    return mailchimp.messages.send({ message, async: true });
  }

  sendTemplate(emailTo, nameTo, subject,template_name,template_content=[],global_merge_vars=[],from_email=null,from_name=null): Promise<any> {
    let message = {
      subject: subject,
      from_email: from_email ? from_email: this.from_email,
      from_name: from_name?from_name:this.from_name,
      to: [
        {
          email: emailTo,
          name: nameTo,
          type: 'to',
        },
      ],
      headers: {
        'Reply-To': this.reply_to_email,
      },
      important: true,
      global_merge_vars
    };
    return mailchimp.messages.sendTemplate({ 
      message, 
      async: true,
      template_name,
      template_content
    });
  }
}
