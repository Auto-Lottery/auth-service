import express from "express";
import { vaultClient } from "../config/vault";
import { generateKeyPairSync } from "crypto";
const testRoutes = express.Router();

testRoutes.get("/", (req, res) => {
  res.send({
    data: "test"
  });
});

testRoutes.get("/testVault", async (req, res) => {
  try {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: "top secret"
      }
    });

    const value = await vaultClient.write("secret/data/hello1", {
      data: { publicKey, privateKey }
    });

    res.send({
      data: value
    });
  } catch (err) {
    console.log("CREATE USER KEYS ERR::: ", err);
    throw Error("INTERNAL SERVER ERROR");
  }
});

export default testRoutes;
