const nodemailer = require("nodemailer");
const {google} = require("googleapis");

const CLIENT_ID = `651673037882-cpl0msdi3ondvkjqect99gr5joe0hjbs.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04gSEXy1RFXGHCgYIARAAGAQSNwF-L9Ir18zMcH0QWHIgqERglbqJDyImvLYcEmlj9TZX21mzTTikwm4Fv2iYFRSK0IZgWhgEr_M`;
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
        user:"sarthakwakodikar4@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: access_token
      }
    })

    const mailOpts = {
      from: "sarthakwakodikar4@gmail.com",
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