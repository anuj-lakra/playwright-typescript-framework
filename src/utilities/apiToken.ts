import { request } from "@playwright/test";

export async function generateToken(
  tenantId: string,
  clientId: string,
  clientSecret: string,
  scope: string,
  username: string,
  password: string
): Promise<string> {
  const response = await request.newContext().then(async (context) => {
    return await context.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        form: {
          grant_type: "password",
          client_id: clientId as string,
          client_secret: clientSecret,
          scope: scope,
          username: username,
          password: password,
        },
      }
    );
  });

  const responseBody = await response.json();
  return responseBody.access_token;
}

export function getToken(tokenType: string): string {
  const { TOKENS } = process.env;
  const tokens = JSON.parse(TOKENS || "{}");
  return tokens[tokenType];
}
