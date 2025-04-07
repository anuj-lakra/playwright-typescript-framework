# Authentication Utility

A utility for managing authentication tokens, specifically designed for Microsoft Azure AD authentication.

## Methods

### `generateToken(tenantId: string, clientId: string, clientSecret: string, scope: string, username: string, password: string): Promise<string>`
Generate an OAuth 2.0 access token using resource owner password credentials flow.

**Parameters:**
- `tenantId`: Azure AD tenant ID
- `clientId`: Application (client) ID
- `clientSecret`: Client secret for the application
- `scope`: Required OAuth 2.0 scopes
- `username`: User's username
- `password`: User's password

**Returns:** Access token as a string

**Example:**
```typescript
import { generateToken } from '@utilities/auth/apiToken';

async function authenticateUser() {
  const token = await generateToken(
    'your-tenant-id',
    'your-client-id',
    'your-client-secret',
    'https://graph.microsoft.com/.default',
    'user@example.com',
    'password123'
  );
}
```

### `getToken(tokenType: string): string`
Retrieve a stored token from environment variables.

**Parameters:**
- `tokenType`: Key of the token in the environment variable

**Returns:** Token string

**Example:**
```typescript
import { getToken } from '@utilities/auth/apiToken';

const apiToken = getToken('API_TOKEN');
```

## Environment Variable Setup

Create a `TOKENS` environment variable as a JSON string:

```json
{
  "API_TOKEN": "your-api-token",
  "ANOTHER_TOKEN": "another-token"
}
```

## Use Cases

1. **OAuth 2.0 Token Generation:** Programmatically obtain access tokens
2. **Secure Token Management:** Retrieve tokens from environment variables
3. **Microsoft Azure AD Authentication:** Simplify authentication for Azure-based applications

## Authentication Flow

The `generateToken` method follows the Resource Owner Password Credentials (ROPC) grant type:
1. Send credentials to Azure AD token endpoint
2. Receive access token
3. Use token for subsequent API requests

## Security Considerations

- Never hard-code credentials in your code
- Use environment variables or secure secret management
- Protect client secrets and tokens
- Implement token refresh mechanisms

## Best Practices

- Store tokens securely
- Use short-lived tokens
- Implement proper error handling
- Rotate tokens regularly
- Use environment-specific configurations

## Error Handling

The utility may throw errors for:
- Invalid credentials
- Network issues
- Token generation failures

## Compatibility

- Designed for Microsoft Azure AD authentication
- Can be extended to support other OAuth 2.0 providers

**Warning:** Ensure you follow your organization's security policies when handling authentication tokens.

**Note:** This utility is a convenience method and should be used with caution, following best security practices.
