
require("dotenv").config();
const { google } = require("googleapis");
const readline = require("readline");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("\nPaste the authorization code here: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());

    if (!tokens.refresh_token) {
      throw new Error("No refresh token returned. Re-authorize with consent.");
    }

    console.log("\nYour refresh token:\n");
    console.log(tokens.refresh_token);
    console.log("\nCopy it securely into Render as GOOGLE_REFRESH_TOKEN.");
  } catch (error) {
    console.error("Authorization failed:", error.message);
  } finally {
    rl.close();
  }
});