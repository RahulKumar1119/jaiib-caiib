# Authentication Implementation

## Overview

This document describes the authentication implementation for the JAIIB-CAIIB Exam Prep Portal. The authentication system provides secure user login, logout, and password reset functionality using JWT tokens and bcrypt password hashing.

## Architecture

### Components

1. **Authentication Lambda Handler** (`src/handlers/auth/index.ts`)
   - Handles login, logout, and password reset operations
   - Generates and validates JWT tokens
   - Manages session state in DynamoDB

2. **CDK Construct** (`src/lib/auth-handler.ts`)
   - Creates and configures the Lambda function
   - Integrates with API Gateway
   - Manages IAM permissions and logging

3. **API Endpoints**
   - `POST /auth/login` - User login
   - `POST /auth/logout` - User logout
   - `POST /auth/reset-password` - Request password reset
   - `POST /auth/verify-reset-token` - Verify and apply password reset

## Security Features

### Password Security

- **Bcrypt Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
- **No Plain Text Storage**: Passwords are never stored in plain text
- **Password Requirements**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one numeric digit

### Token Security

- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: 30-minute expiration for login tokens
- **Token Encryption**: Session tokens are encrypted before storage
- **Reset Token Expiration**: 24-hour expiration for password reset tokens
- **Single-Use Reset Tokens**: Reset tokens can only be used once

### Data Protection

- **Encrypted Storage**: Sensitive data is encrypted using AES-256-GCM
- **DynamoDB Encryption**: All data at rest is encrypted with KMS
- **TLS in Transit**: All API communication uses HTTPS/TLS

## API Endpoints

### POST /auth/login

Authenticates a user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "tenant_id": "tenant-123",
    "role": "officer"
  },
  "expiresIn": 1800
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request (validation error)
- 401: Authentication failed
- 500: Server error

### POST /auth/logout

Invalidates the user's session token.

**Request:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized (missing or invalid token)
- 500: Server error

### POST /auth/reset-password

Initiates a password reset by sending a reset token to the user's email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** The response is the same whether the email exists or not, to prevent user enumeration attacks.

**Status Codes:**
- 200: Success
- 400: Invalid email format
- 500: Server error

### POST /auth/verify-reset-token

Verifies the reset token and updates the user's password.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewSecurePassword123",
  "confirmPassword": "NewSecurePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid request (validation error)
- 401: Invalid or expired token
- 500: Server error

## JWT Token Structure

The JWT token contains the following claims:

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "tenant_id": "tenant-123",
  "role": "officer",
  "iat": 1234567890,
  "exp": 1234569690
}
```

**Claims:**
- `user_id`: Unique user identifier
- `email`: User's email address
- `tenant_id`: Tenant identifier for multi-tenancy
- `role`: User's role (officer, admin, super_admin)
- `iat`: Token issued at timestamp
- `exp`: Token expiration timestamp

## Database Schema

### Users Table

The authentication system uses the following fields in the Users table:

```typescript
{
  email: string;                    // Partition key
  user_id: string;                  // UUID
  full_name: string;
  password_hash: string;            // Bcrypt hash
  tenant_id: string;
  role: string;                     // officer, admin, super_admin
  session_token?: string;           // Encrypted JWT token
  session_expires_at?: string;      // ISO 8601 timestamp
  last_login?: string;              // ISO 8601 timestamp
  reset_token?: string;             // Encrypted reset token
  reset_token_expires_at?: string;  // ISO 8601 timestamp
  created_at: string;               // ISO 8601 timestamp
  updated_at: string;               // ISO 8601 timestamp
}
```

## Configuration

### Environment Variables

The authentication handler uses the following environment variables:

```
AWS_REGION=ap-south-1
USERS_TABLE=Users
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION_MINUTES=30
BCRYPT_SALT_ROUNDS=10
```

### Lambda Configuration

- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Layers**: Common dependencies, Utility functions

## Error Handling

### Validation Errors (400)

- Invalid email format
- Missing password
- Password doesn't meet requirements
- Passwords don't match
- Invalid reset token format

### Authentication Errors (401)

- Invalid email or password
- Missing authorization header
- Invalid or expired JWT token
- Invalid or expired reset token

### Server Errors (500)

- Database connection errors
- Encryption/decryption errors
- JWT signing errors

## Testing

### Unit Tests

Run the authentication handler tests:

```bash
cd src/handlers/auth
npm test
```

Tests cover:
- Successful login with valid credentials
- Login rejection for invalid email/password
- Logout functionality
- Password reset request
- Password reset verification
- Token generation and validation
- Security headers
- Error handling

### Integration Tests

Test the full authentication flow:

1. Register a new user
2. Login with credentials
3. Verify JWT token
4. Request password reset
5. Verify reset token
6. Update password
7. Login with new password
8. Logout

## Best Practices

### For Developers

1. **Never log sensitive data**: Don't log passwords, tokens, or personal information
2. **Use HTTPS**: Always use HTTPS for API calls
3. **Validate input**: Validate all input on both client and server
4. **Handle errors gracefully**: Don't expose internal error details to users
5. **Implement rate limiting**: Prevent brute force attacks
6. **Use secure storage**: Store tokens securely (HttpOnly cookies or secure storage)

### For Operations

1. **Rotate JWT secret**: Rotate the JWT secret regularly
2. **Monitor failed logins**: Set up alerts for multiple failed login attempts
3. **Audit logs**: Enable CloudWatch logging for all authentication events
4. **Backup database**: Regularly backup the Users table
5. **Update dependencies**: Keep bcrypt and jsonwebtoken updated

## Security Considerations

### Brute Force Protection

- Implement rate limiting on login endpoint (100 requests/minute per user)
- Consider implementing exponential backoff after multiple failed attempts
- Log failed login attempts for monitoring

### Session Management

- Sessions expire after 30 minutes of inactivity
- Users can manually logout to invalidate sessions
- Session tokens are encrypted before storage

### Password Reset

- Reset tokens expire after 24 hours
- Reset tokens are single-use (invalidated after use)
- Reset token is not returned in response (sent via email)
- Email verification prevents unauthorized password resets

### Multi-Tenancy

- All queries include tenant_id validation
- Users can only access their own tenant's data
- Role-based access control enforces permissions

## Troubleshooting

### Login Fails with "Invalid email or password"

- Verify email is correct
- Verify password is correct
- Check if user account exists
- Check if user account is active

### Token Expired Error

- Token expires after 30 minutes
- User needs to login again to get a new token
- Consider implementing token refresh mechanism

### Password Reset Not Working

- Verify email address is correct
- Check if reset token has expired (24 hours)
- Verify reset token is valid
- Check email for reset link

### Database Connection Error

- Verify AWS credentials are configured
- Verify DynamoDB table exists
- Verify Lambda has permissions to access DynamoDB
- Check CloudWatch logs for detailed error messages

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**: Add TOTP or SMS-based MFA
2. **OAuth Integration**: Support OAuth providers (Google, Microsoft)
3. **Token Refresh**: Implement refresh tokens for better security
4. **Session Management**: Add session management UI for users
5. **Audit Logging**: Enhanced audit logging for compliance
6. **Rate Limiting**: Implement per-user rate limiting
7. **Email Verification**: Require email verification for new accounts
8. **Account Lockout**: Implement account lockout after failed attempts

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Security](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/security.html)
