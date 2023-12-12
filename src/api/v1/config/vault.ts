import vault from "node-vault";
import { VAULT_TOKEN, VAULT_URL } from ".";

export const vaultClient = vault({
  apiVersion: "v1", // default
  endpoint: VAULT_URL, // default
  token: VAULT_TOKEN //
});

export const getVaultData = async (
  path: string
): Promise<Record<string, string>> => {
  try {
    const res = await vaultClient.read(path);
    return res?.data?.data;
  } catch (err) {
    console.log("LOAD CONFIG FROM VAULT ERR::: ", err);
    throw new Error("INTERNAL_SERVER_ERROR");
  }
};
