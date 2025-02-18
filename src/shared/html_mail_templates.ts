import { capitalizeWords, capitalize, format_date_only } from "./helpers";

const getCardImg = (cardType: string) => {
  if (!cardType) return;
  let _cardType = cardType.toLowerCase();
  switch (_cardType) {
    case 'visa':
      return 'https://cdn.dibsy.one/mails/visa_email.png';

    case 'mastercard':
      return 'https://cdn.dibsy.one/mails/mc_email.png';

    case 'amex':
      return 'https://cdn.dibsy.one/mails/amex_email.png';

    default:
      return '';
  }
};

const getTestModeCustomerMessage=()=>{
  return `<div class="mail" align="center" bgcolor="#f05050" style="width:600px;margin:auto;color:white;background:#f05050;text-align:center;padding:20px 60px;font-size:18px"> 
  Please note that this email was generated from a test environment.
  </div>`
}

const getTestModeMechantMessage=()=>{
  return `<div bgcolor="#f05050" style="width:100%;color:white;background:#f05050;text-align:center;padding:20px 0;font-size:18px;margin-bottom:20px"> 
  Please note that this email was generated from a test environment.
  </div>`
}

function EmailLayout(
  content = '',
  buttonUrl = '#',
  buttonText = null,
  title = 'Hey there,',
  testMode=false
) {
  return `
     <html>
     <head>
     <meta name="color-scheme" content="light dark">
     <meta name="supported-color-schemes" content="light dark">
       <link rel="preconnect" href="https://fonts.gstatic.com">
       <link href="https://fonts.googleapis.com/css2?family=Roboto" rel="stylesheet">
       <style type="text/css">
     
       *{
        font-family: 'Roboto', sans-serif;
        color:black;
      }
      p,td{
        font-size:18px;
        color:#00000;
      }
     
         .buttonWrapper{
           margin-top:40px
         }
         .button {
           -webkit-border-radius:  6px; 
           -moz-border-radius:  6px;  
           border-radius: 6px;
         }
         
         .button a {
           padding: 8px 12px;
           border: 1px solid #33CC66;
           font-family: Roboto, sans-serif;
           font-size:18px;
           color: #ffffff; 
           text-decoration: none;
           display: block;
           -webkit-border-radius:  6px; 
           -moz-border-radius:  6px;  
           border-radius: 6px;
         }
         .title{
           color:#33CC66;
           font-size:24px;
           font-weight:bold;
           font-family: Roboto, sans-serif;
         }
         a{
           font-family: Roboto, sans-serif;
           color:#33CC66;
         }
         .box{
           padding:15px 20px;
           margin:30px 0;
           background-color:#426662;
           color:white;
           -webkit-border-radius:  10px; 
           -moz-border-radius:  10px;  
           border-radius: 10px;
         }
         .copyright{
           font-size:13px;
         }
     
         @media screen and (max-width:520px){
           body{
             padding-top:0!important;
           }
           table,.button{
             width:100%;
           }  
           .mail{
             width: calc(100% - 40px);
           }
           .box-item{
             text-align:center;
           }
         }

         @media (prefers-color-scheme: dark ) {
          .dark-img { display:block !important; width: auto !important; overflow: visible !important; float: none !important; max-height:inherit !important; max-width:inherit !important; line-height: auto !important; margin-top:0px !important; visibility:inherit !important; }

          .light-img {  display:none !important; }
        }
       
       </style>
     </head>
     <body style="margin:0!important">
       <div class="mail" style="color:black;width:500px;margin:auto;background-color:white;padding:20px;padding-bottom:15px;background-repeat: no-repeat;-webkit-background-position:center bottom;-moz-background-position:center bottom;background-position:center bottom" align="center">
       ${
         testMode ? getTestModeMechantMessage() :""
       }
         <img height="25" width="auto" style="height:25px;width:auto;"  src="https://mcusercontent.com/88f481db2b2b0573589780ba3/images/4f2214c5-8493-1a49-5b83-4f3d7ac77d22.png" style="margin:20px 0" />
         <p style="font-size:24px" class="title roboto-font">${title}</p>
         ${content}
         ${
           buttonText
             ? `<table width="100%" cellspacing="0" cellpadding="0" class="buttonWrapper">
              <tr>
                  <td>
                      <table  align="center" cellspacing="0" cellpadding="0">
                          <tr>
                              <td class='button' bgcolor="#33CC66">
                                  <a align="center" class='link roboto-font' href="${buttonUrl}" target="_blank">
                                    ${buttonText}         
                                  </a>
                              </td>
                          </tr>
                      </table>
                  </td>
              </tr>
            </table>`
             : ''
         }

         
         <div class="box" align="left">
            <div class="box-item"><img  width="35" src='https://cdn.dibsy.one/mails/hand_email.png' /> </div>
            <p class="box-item" style="color:white;font-size:18px;font-weight:bold">We love hearing from you!</p>
            <p class="box-item" style="color:white">Have any questions? Please check out our <a style="font-family: Roboto, sans-serif;color:#33CC66;"  href="https://support.dibsy.one">help center.</a></p>
          </div>
       <p align="center">
       Follow us on <a style="color:#33cc66" href="https://twitter.com/DibsyHQ">Twitter</a> and <a style="color:#33cc66" href="https://www.linkedin.com/company/dibsyhq">LinkedIn</a>
       </p>
       <p align="center" class='copyright'>© 2021 Dibsy, All rights reserved. </p> 
       <img style="margin-top:25px" width='100%' src='https://cdn.dibsy.one/mails/email_background.png'/>
       </div>
     </body>
     </html>`;
}

function EmailLayoutCard(content = '',testMode=false) {
  return `
     <html>
     <head>
     
       <link rel="preconnect" href="https://fonts.gstatic.com">
       <link href="https://fonts.googleapis.com/css2?family=Roboto" rel="stylesheet">
       <style type="text/css">
     
         *{
           font-family: 'Roboto', sans-serif;
           color:black;
         }
         p{
           font-size:18px;
         }
     
         .buttonWrapper{
           margin-top:40px
         }
         .button {
           -webkit-border-radius:  6px; 
           -moz-border-radius:  6px;  
           border-radius: 6px;
         }
         
         .button a {
           padding: 8px 12px;
           border: 1px solid #33CC66;
           font-family: Roboto, sans-serif;
           font-size:18px;
           color: #ffffff; 
           text-decoration: none;
           display: block;
           -webkit-border-radius:  6px; 
           -moz-border-radius:  6px;  
           border-radius: 6px;
         }
         .title{
           color:#33CC66;
           font-size:24px;
           font-weight:bold;
           font-family: Roboto, sans-serif;
         }
     
         @media screen and (max-width:620px){
           body{
             padding-top:0!important;
           }
           table,.button{
             width:100%;
           }  
           .mail,.whiteBox{
             width: calc(100% - 40px);
           }
           .box-item{
             text-align:center;
           }
         }
       
       </style>
     </head>
     <body style="margin:0!important;padding:30px 0px!important;background-color:#F4F4F4;">
     ${
      testMode ? getTestModeCustomerMessage() : ""
      }
       <div class="mail" style="color:black;width:600px;margin:auto;background-color:#E2E7EE;padding:30px 60px;" align="center">
          <div style="border-radius: 0 0 20 0 rgba(255,255,255,.2);border-radius:10px;background-color:white;padding:30px;text-align:left;" class="whiteBox" align="center">
            ${content}
        </div>
       </div>
     </body>
     </html>`;
}

export function getSignupMailHtml(name, url) {
  let content = `
  <p class="roboto-font">
  If you’re reading this, it means you gave us a real email — a rare occurrence on the internet. Thank you :)
 </p>
<p class="roboto-font">Please click on the button below to validate your email address and confirm that you are the owner of this account. 
</p>`;

  return EmailLayout(content, url, 'Confirm email');
}
export function getWeclomeMailHtml() {
  let content = `
    <p>Congratulations on taking the first step in growing your business online.
    </p>
    <p>Ugh, we hate being annoying too, but you’re almost done! We have your details, 
    but we need a just bit more to activate your account, 
    please log in to the Dibsy dashboard and submit the required documents.
    </p>
    `;

  return EmailLayout(content, process.env.FRONT_URL, 'Go to dashboard');
}
export function getPasswordChangedHtml(fullName) {
  let content = `
  <p class="roboto-font">
    We're just confirming that your Dibsy password has been recently updated.
  </p>
  <p class="roboto-font">
    If you did not request a password reset, please reply to this email or write to us at <a style="color:#33CC66" href="mailto:support@dibsy.one">support@dibsy.one</a>. This ensures that any possible breaches are looked into by the Dibsy security team and resolved. 
  </p>`;

  return EmailLayout(content, 'https://support.dibsy.one', 'Get Help',`Hi ${fullName}`);
}
export function getResetPasswordHtml(url) {
  let content = `
    <p class="roboto-font">Forgot you password? We’ve all been there. But don’t worry, we’ve got your back! If this was you, click the button below to set up a new password for your account.
    </p>
    <p class="roboto-font">If this wasn't you, ignore this email and the link will expire on its own.</p>`;

  return EmailLayout(content, url, 'Set up password',`Opps...`);
}

export function getMerchantApprovedHtml() {
  let message = `
    <p>Your account is now fully verified and you are ready to start accepting payments online from your customers.</p>`;

  return EmailLayout(message, process.env.FRONT_URL, 'Sign In', 'All Done!');
}

export function sendNotificationOfMailChanged(email) {
  let message = `
    <p>We're just confirming that your Dibsy email has changed.</p>
    <p>The new email address is : ${email}</p>`;

  return EmailLayout(message);
}

export function sendEmailChangedVerification(name, token) {
  let message = `
    <p>We're just confirming that your Dibsy email has changed</p>
    <p>Follow the link bellow to verify your email</p>`;
  let url = generateRedirectURL(`/callback/verify/email_change/${token}`);

  return EmailLayout(message, url, 'Verify my email');
}

//! not implemented in mandrill
export function getPurchaseConfirmationHtml(
  merchantName="Unnamed Business",
  merchantEmail,
  payemntRef,
  amountPaid: number,
  currency,
  paidAt,
  cardNumber,
  cardType,
  checkoutLogo,
  customerName,
  testMode
) {
  let message = `
  <table>
    <tr>
      <td rowspan=2 style="padding-right:20px"><img width="87" height="auto" src='${
        checkoutLogo
          ? checkoutLogo
          : 'https://cdn.dibsy.one/mails/checkout.png'
      }' /></td>
      <td style="font-size:26px;font-weight:bold;">Receipt from <br>  ${capitalizeWords(merchantName)}</td>
    </tr>
    <tr>
      <td style="font-size:14px">Payment Reference: ${payemntRef}</td></tr>
  </table>
  <hr style="height:1px;margin-top:20px;border-width:0;background-color:#E2E7EE" />
  <h1 style="font-size:20px;margin-top:30px">Hello ${capitalize(customerName)},</h1>
  <p style="font-size:16px;">This is a receipt for your charges at ${capitalizeWords(merchantName)}. Below you’ll find a brief summary of your payment.</p>

  <h1 style="font-size:22px;margin-top:30px;margin-bottom:0px;color:#33CC66">Summary</h1>
  <hr style="height:1px;border-width:0;background-color:#E2E7EE" />

  <table style="width:100%" >
        <tr style="font-size:17px">
          <td style="font-weight:bold;padding:10px 0">Amount Paid</td>
          <td align="right">${amountPaid} ${currency}</td>
        </tr>
        <tr style="font-size:17px">
          <td style="font-weight:bold;padding:10px 0">Date Paid</td>
          <td align="right">${paidAt}</td>
        </tr>
        <tr style="font-size:17px">
          <td style="font-weight:bold;padding:10px 0">Payment Method</td>
          <td align="right" styles="vertical-align: bottom;"><img style="margin-left:4px" height="20" width="auto" src="${getCardImg(
    cardType,
  )}" /> ${cardNumber} </td>
        </tr>
        </tr>
    </table>

    <hr style="margin-top:20px;margin-bottom:25px;height:1px;border-width:0;background-color:#E2E7EE" />

    <p style="line-height:25px;text-align:center">If you have any questions, please contact <b>${capitalizeWords(merchantName)}</b>. </p>
    
    <hr style="margin-top:25px;height:1px;border-width:0;background-color:#E2E7EE" />

    <img style="margin-top:15px;margin-bottom:10px" src="https://cdn.dibsy.one/mails/logo_footer_email.png" />

    <p style="font-size:14px">You’re receiving this e-mail because you made a purchase at ${merchantName}, which partners with Dibsy to provide payment processing.</p>

`;

  return EmailLayoutCard(message,testMode);
}
//! not implemented in mandrill
export function getCustomerPaidOrderHtml(
  amount,
  fees,
  currency,
  orderID,
  date_paid,
  method,
  cardNumber,
  customerName = 'a customer',
  merchantName,
  testMode=false
) {
  let message = `
    <p>A payment from ${
      customerName ? customerName : 'a customer'
    }  was successful.</p>
    <p>Head to your dashboard to see more information on this payment.</p>
    <table style="width:400px;border:1px solid #E2E7EE;padding:15px;margin-top:15px" >
        <tr>
          <td colspan=2 style="font-size:20px;font-weight:bold;color:#33CC66;border-bottom:1px solid #E2E7EE;padding-bottom:15px" >Summary</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Amount Paid</td>
          <td align="right">${amount} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Transaction Fees</td>
          <td align="right">${fees} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Order ID</td>
          <td align="right">${orderID}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Date Paid</td>
          <td align="right">${format_date_only(date_paid)}</td>
        </tr>
        <tr style="font-size:18px">
        <td style="font-weight:bold;padding:10px 0;padding-bottom:30px">Payment Method</td>
        <td style="padding:10px 0;padding-bottom:30px" align="right" styles="vertical-align: bottom;"><img style="margin-left:4px" height="20" width="auto" src="${getCardImg(
          method,
)}" />  ${cardNumber} </td>
        <tr>
          <td colspan=2 class='button'  bgcolor="#33CC66">
            <a style="font-size: 18px;" align="center" class='link roboto-font' href="${
              process.env.FRONT_URL
            }" target="_blank">
              Go to dashboard       
            </a>
        </td>
        </tr>
    </table>
    `;

  return EmailLayout(message,null,null,`Hi ${merchantName}`,testMode);
}
//! not implemented in mandrill
export function getSettlementHtml(
  amount,
  fees,
  netTotal,
  refundDeducted,
  currency,
  payoutDate,
  settlementRef,
  merchantName
) {
  let message = `
    <p>You've just received a payout from Dibsy for the amount of ${currency} ${amount} (minus fees and refunds) and will arrive in your bank shortly. </p>
    <table style="width:400px;border:1px solid #E2E7EE;padding:15px;margin-top:15px" >
        <tr>
          <td colspan=2 style="font-size:20px;font-weight:bold;color:#33CC66;border-bottom:1px solid #E2E7EE;padding-bottom:15px" >Summary</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Transaction Total</td>
          <td align="right">${amount} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Transaction Fees</td>
          <td align="right">${fees} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Refunds Deducted</td>
          <td align="right">${refundDeducted} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Net Total</td>
          <td align="right">${netTotal} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Payout Date</td>
          <td align="right">${format_date_only(payoutDate)}</td>
        </tr>
        <tr style="font-size:18px">
        <td style="font-weight:bold;padding:10px 0;padding-bottom:30px">Settlement Reference</td>
        <td style="padding:10px 0;padding-bottom:30px" align="right" styles="vertical-align: bottom;">${settlementRef} </td>
        <tr>
          <td colspan=2 class='button'  bgcolor="#33CC66">
            <a align="center" class='link roboto-font' href="${
              process.env.FRONT_URL
            }" target="_blank">
              Go to dashboard       
            </a>
        </td>
        </tr>
    </table>
    `;

  return EmailLayout(message,null,null,`Hi ${merchantName}`);
}
//! not implemented in mandrill
export function getRefundApprovedHtml(
  transactionAmount,
  refundAmount,
  currency,
  transactionDate,
  refundDate,
  method,cardNumber,merchantName
) {
  let message = `
    <p>Your refund request for the amount of ${currency} ${refundAmount} made on ${format_date_only(refundDate)} has been successfully processed. The cardholder will now be compensated subject to banking processing times. Any fees owed will be deducted out of your next payout.

    <table style="width:400px;border:1px solid #E2E7EE;padding:15px;margin-top:15px" >
        <tr>
          <td colspan=2 style="font-size:20px;font-weight:bold;color:#33CC66;border-bottom:1px solid #E2E7EE;padding-bottom:15px" >Summary</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Transaction Amount</td>
          <td align="right">${transactionAmount} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Refund Amount</td>
          <td align="right">${refundAmount} ${currency}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Transaction Date</td>
          <td align="right">${format_date_only(transactionDate)}</td>
        </tr>
        <tr style="font-size:18px">
          <td style="font-weight:bold;padding:10px 0">Refund Date</td>
          <td align="right">${format_date_only(refundDate)}</td>
        </tr>
        <tr style="font-size:18px">
        <td style="font-weight:bold;padding:10px 0;padding-bottom:30px">Payment Method</td>
        <td style="padding:10px 0;padding-bottom:30px" align="right" styles="vertical-align: bottom;"><img style="margin-left:4px" height="20" width="auto" src="${getCardImg(
          method,
)}" />  ${cardNumber} </td>
        <tr>
          <td colspan=2 class='button'  bgcolor="#33CC66">
            <a align="center" class='link roboto-font' href="${
              process.env.FRONT_URL
            }" target="_blank">
              Go to dashboard       
            </a>
        </td>
        </tr>
    </table>
    `;

  return EmailLayout(message,null,null,`Hi ${merchantName}`);
}

function generateRedirectURL(uri: string): string {
  return `${process.env.FRONT_URL}${uri}`;
}
