# Complete Auth Routes Implementation

## Overview
Production-ready authentication system with JWT access tokens, refresh tokens, email verification, password reset, and OAuth support (placeholders).

## Implemented Endpoints

### Public Endpoints

#### POST /api/v1/auth/signup
- **Description**: Register a new user with email/password
- **Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "User Name"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Account created successfully. Please check your email to verify your account.",
    "user": {
      "id": "USR-...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "read_only",
      "email_verified": false
    }
  }
  ```
- **Features**:
  - Password validation (min 8 chars, uppercase, lowercase, number)
  - Email verification token generation
  - Verification email sent automatically

#### POST /api/v1/auth/login
- **Description**: Login with email/password, returns access and refresh tokens
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "USR-...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "read_only",
      "email_verified": true,
      "preferences": {...}
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
  ```
- **Features**:
  - Short-lived access token (15 minutes default)
  - Long-lived refresh token (7 days default)
  - Refresh token stored in database with metadata
  - Session tracking in database and Redis

#### POST /api/v1/auth/refresh
- **Description**: Refresh access token using refresh token
- **Body**:
  ```json
  {
    "refreshToken": "eyJhbGc..."
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGc..."
  }
  ```
- **Features**:
  - Validates refresh token in database
  - Checks expiration and revocation
  - Returns new access token

#### POST /api/v1/auth/logout
- **Description**: Revoke refresh token and invalidate session
- **Body**:
  ```json
  {
    "refreshToken": "eyJhbGc..."
  }
  ```
- **Response**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```
- **Features**:
  - Revokes refresh token in database
  - Invalidates session
  - Removes from Redis cache

#### GET /api/v1/auth/verify-email?token=...
- **Description**: Verify email address using token from email
- **Query**: `token` - verification token from email
- **Response**:
  ```json
  {
    "message": "Email verified successfully",
    "verified": true
  }
  ```
- **Features**:
  - Validates token and expiration
  - Marks email as verified
  - Prevents reuse of tokens

#### POST /api/v1/auth/resend-verification
- **Description**: Resend email verification token
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Verification email sent successfully"
  }
  ```
- **Features**:
  - Revokes old tokens
  - Generates new token
  - Sends verification email

#### POST /api/v1/auth/forgot-password
- **Description**: Request password reset
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "message": "If an account exists with this email, a password reset link has been sent."
  }
  ```
- **Features**:
  - Security: Doesn't reveal if email exists
  - Generates reset token (1 hour expiry)
  - Sends password reset email

#### POST /api/v1/auth/reset-password
- **Description**: Reset password using token
- **Body**:
  ```json
  {
    "token": "reset-token-from-email",
    "password": "NewSecurePass123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Password reset successfully. Please log in with your new password."
  }
  ```
- **Features**:
  - Validates token and expiration
  - Prevents token reuse
  - Revokes all refresh tokens for security
  - Updates password hash

### Protected Endpoints (Require Authentication)

#### POST /api/v1/auth/change-password
- **Description**: Change password (requires current password)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Body**:
  ```json
  {
    "currentPassword": "OldPass123",
    "newPassword": "NewSecurePass123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Password changed successfully. Please log in again."
  }
  ```
- **Features**:
  - Verifies current password
  - Revokes all refresh tokens after password change
  - Requires authentication

#### POST /api/v1/auth/oauth/unlink
- **Description**: Unlink OAuth account
- **Headers**: `Authorization: Bearer <accessToken>`
- **Body**:
  ```json
  {
    "provider": "google"
  }
  ```
- **Response**:
  ```json
  {
    "message": "google account unlinked successfully"
  }
  ```
- **Features**:
  - Prevents unlinking last auth method
  - Requires authentication

### OAuth Endpoints (Placeholders - Not Yet Implemented)

#### GET /api/v1/auth/oauth/google
- **Status**: Returns 501 Not Implemented
- **TODO**: Implement with passport-google-oauth20

#### GET /api/v1/auth/oauth/google/callback
- **Status**: Returns 501 Not Implemented
- **TODO**: Implement with passport-google-oauth20

#### GET /api/v1/auth/oauth/github
- **Status**: Returns 501 Not Implemented
- **TODO**: Implement with passport-github2

#### GET /api/v1/auth/oauth/github/callback
- **Status**: Returns 501 Not Implemented
- **TODO**: Implement with passport-github2

## Security Features

1. **Short-lived Access Tokens**: 15 minutes default (configurable via `JWT_EXPIRY`)
2. **Refresh Token Rotation**: Tokens stored in database with family IDs
3. **Token Revocation**: Logout revokes refresh tokens
4. **Password Security**: 
   - Bcrypt with 12 rounds
   - Minimum 8 characters with complexity requirements
5. **Email Verification**: Required for account activation
6. **Session Tracking**: IP address and user agent stored
7. **Token Blacklisting**: Redis-based blacklist for revoked tokens (optional)
8. **No Mock Tokens**: Production-ready only, no development shortcuts

## Database Schema

All auth-related tables are in `migrations/002_auth_schema.sql`:
- `refresh_tokens` - Refresh token storage with metadata
- `oauth_accounts` - OAuth provider accounts
- `email_verification_tokens` - Email verification tokens
- `password_reset_tokens` - Password reset tokens
- `user_sessions` - Active session tracking
- Extended `users` table with `email_verified` and `email_verified_at`

## Environment Variables

Required:
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `JWT_EXPIRY` - Access token expiry (default: "15m")
- `REFRESH_TOKEN_EXPIRY` - Refresh token expiry (default: "7d")
- `FRONTEND_URL` - Frontend URL for email links (default: "http://localhost:3000")
- `BASE_URL` - Base URL for email links (defaults to FRONTEND_URL)

## Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `INVALID_CREDENTIALS` - Wrong email/password
- `INVALID_TOKEN` - Invalid or malformed token
- `TOKEN_EXPIRED` - Token has expired
- `TOKEN_REVOKED` - Token has been revoked
- `TOKEN_USED` - Token has already been used
- `USER_EXISTS` - User with email already exists
- `USER_NOT_FOUND` - User not found
- `ALREADY_VERIFIED` - Email already verified
- `MISSING_TOKEN` - Authorization header missing
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `EMAIL_SEND_FAILED` - Failed to send email
- `LAST_AUTH_METHOD` - Cannot unlink last authentication method
- `NOT_IMPLEMENTED` - Feature not yet implemented (OAuth)

## Next Steps

1. **OAuth Implementation**: 
   - Install `passport`, `passport-google-oauth20`, `passport-github2`
   - Implement OAuth routes
   - Add OAuth account linking to signup/login

2. **Email Service**: 
   - Replace placeholder with nodemailer/SendGrid/SES
   - Configure SMTP or API credentials

3. **Rate Limiting**: 
   - Add stricter rate limits for auth endpoints
   - Implement CAPTCHA for repeated failed attempts

4. **Security Enhancements**:
   - Add 2FA support
   - Implement account lockout after failed attempts
   - Add device tracking

