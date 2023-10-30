const nodemailer = require("nodemailer");
const {google} = require("googleapis");

const CLIENT_ID = `975389664778-k4gnrr29b04jnv0oodubnn4qi1idqsm7.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//040S3qCr39j04CgYIARAAGAQSNwF-L9IrTIYWtl8F-QC7i5MwzhPjIRlIaRIczxgY9B9LNIrkfhwdLwe504OKv6w48J1bAMzktb8`;
const REDIRECT_URI = `https://developers.google.com/oauthplayground/`;

const oauthclient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauthclient.setCredentials({refresh_token: REFRESH_TOKEN});

async function sendMail(receiver, text){ 
  try{
    const access_token = await oauthclient.getAccessToken();
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: "OAuth2",
        user:"jatinwakodikar@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: access_token
      }
    })

    const mailOpts = {
      from: "jatinwakodikar@gmail.com",
      to: receiver,
      subject: "Test test",
      text: "That was Easy",
      html: text
    }

    const result = await transport.sendMail(mailOpts);
    return result;
  }
  catch(err){
    return err;
  }
}

module.exports = sendMail;