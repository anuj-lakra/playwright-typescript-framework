/* eslint-disable */

import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

const plaintextPassword = ""; // Replace with the actual password
const secret = process.env.SECRET_KEY; // Replace with the actual secret

const hashedPassword = CryptoJS.AES.encrypt(
  plaintextPassword,
  secret
).toString();
console.log("Hashed Password:", hashedPassword);

const bytes = CryptoJS.AES.decrypt(hashedPassword, secret);
console.log("Bytes:", bytes);
const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
console.log("Decrypted Password:", decryptedPassword);
