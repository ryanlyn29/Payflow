# User Settings Persistence Implementation

Real user settings persistence with PostgreSQL has been fully implemented. All user preferences are now stored in the database and persist across sessions.

## Backend Implementation

### Database Schema

User preferences are stored in the `users` table as a JSONB column:

```sql
preferences JSONB DEFAULT '{"theme": "dark", "density": "comfortable", "notifications_enabled": true, "default_region": "us-east-1"}'::jsonb
```

### API Endpoints (`backend/node-api/src/routes/users.ts`)

#### `GET /api/v1/users/me`
- **Description**: Get current user profile with preferences
- **Authentication**: Required
- **Response**: 
  ```json
  {
    "user": {
      "id": "USR-...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "read_only",
      "preferences": {
        "theme": "dark",
        "density": "comfortable",
        "notifications_enabled": true,
        "default_region": "us-east-1"
      },
      "email_verified": true,
      "created_at": "...",
      "updated_at": "..."
    }
  }
  ```

#### `PATCH /api/v1/users/me`
- **Description**: Update user profile (name, email)
- **Authentication**: Required
- **Body**:
  ```json
  {
    "name": "New Name",
    "email": "newemail@example.com"
  }
  ```
- **Features**:
  - Validates email uniqueness
  - Marks email as unverified if changed
  - Updates `updated_at` timestamp

#### `PATCH /api/v1/users/me/preferences`
- **Description**: Update user preferences
- **Authentication**: Required
- **Body**:
  ```json
  {
    "preferences": {
      "theme": "dark",
      "density": "compact",
      "notifications_enabled": false,
      "default_region": "eu-central-1"
    }
  }
  ```
- **Features**:
  - Merges with existing preferences (partial updates)
  - Validates preference keys
  - Updates `updated_at` timestamp
  - Returns updated user object

#### `GET /api/v1/users/me/sessions`
- **Description**: Get active user sessions
- **Authentication**: Required
- **Response**:
  ```json
  {
    "sessions": [
      {
        "id": "TOK-...",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "last_active_at": "...",
        "created_at": "...",
        "expires_at": "..."
      }
    ]
  }
  ```

#### `DELETE /api/v1/users/me/sessions/:sessionId`
- **Description**: Revoke a specific session
- **Authentication**: Required
- **Features**:
  - Verifies session belongs to user
  - Revokes associated refresh token
  - Logs revocation

### Allowed Preference Keys

- `theme`: `"dark" | "light"`
- `density`: `"comfortable" | "compact"`
- `notifications_enabled`: `boolean`
- `default_region`: `string` (e.g., "us-east-1")
- `timezone`: `string` (optional)
- `language`: `string` (optional)

## Frontend Implementation

### API Service (`frontend/react/services/api.ts`)

**New Methods:**
- `getCurrentUserFromAPI()`: Fetch fresh user data from API
- `updateProfile(data)`: Update user name/email
- `updatePreferences(prefs)`: Update user preferences
- `getSessions()`: Get active sessions
- `revokeSession(sessionId)`: Revoke a session

**Features:**
- Automatically parses JSONB preferences from API
- Updates localStorage after API calls
- Handles errors gracefully

### Profile Page (`frontend/react/pages/Profile.tsx`)

**Features:**
- Real-time form with user data
- Saves name and preferences to database
- Shows success/error messages
- Discard changes button
- Auto-updates when user data changes

**Settings:**
- Display Name (editable)
- Email (read-only, shows verification status)
- UI Density (comfortable/compact)
- Operational Region (dropdown)
- Push Notifications (toggle)

### Settings Page (`frontend/react/pages/Settings.tsx`)

**Features:**
- Theme switcher (Light/Dark) with immediate application
- Real-time persistence to database
- Success/error feedback
- Account information display
- Email verification status

### Auth Context (`frontend/react/components/AuthContext.tsx`)

**Enhanced:**
- Automatically refreshes user data on mount
- Applies theme preference on load
- Updates localStorage with fresh data
- Handles API failures gracefully

## Data Flow

1. **On Login:**
   - User data (including preferences) stored in localStorage
   - Theme preference applied immediately

2. **On App Load:**
   - Loads user from localStorage
   - Fetches fresh data from API
   - Applies theme preference
   - Updates localStorage with fresh data

3. **On Preference Update:**
   - API call to update preferences
   - Database updated with merged preferences
   - localStorage updated
   - UI updated immediately (e.g., theme)

4. **On Profile Update:**
   - API call to update profile
   - Database updated
   - localStorage updated
   - UI reflects changes

## Error Handling

- **Backend**: Proper error codes (VALIDATION_ERROR, EMAIL_EXISTS, USER_NOT_FOUND)
- **Frontend**: User-friendly error messages
- **Graceful Degradation**: Falls back to localStorage if API fails
- **Validation**: Frontend and backend validation

## Security

- All endpoints require authentication
- User can only update their own profile/preferences
- Email uniqueness validation
- Session revocation requires ownership verification
- Preferences validated against allowed keys

## Testing

To test:
1. Sign up or log in
2. Go to Profile page
3. Change name, density, region, notifications
4. Click "Save Profile"
5. Refresh page - changes should persist
6. Go to Settings page
7. Change theme - should apply immediately and persist
8. Log out and log back in - preferences should be restored

## Database Migration

The preferences column already exists in the initial schema. No additional migration needed.

## Future Enhancements

- Add more preference options (timezone, language, date format)
- Session management UI (view/revoke sessions)
- Preference import/export
- Preference templates/presets
- Audit log for preference changes

