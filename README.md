# MyCoffee.Ai Backend API

A personalized coffee recommendation platform built with Node.js, Express, and MSSQL.

## Features

- **OAuth Authentication** - Support for Kakao, Naver, Apple, and Google
- **JWT Token Management** - Stateless authentication with secure tokens
- **Database Integration** - MSSQL with connection pooling
- **Login Logging** - Comprehensive audit trail for authentication attempts
- **API Documentation** - RESTful endpoints with proper error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Microsoft SQL Server (MSSQL)
- **Authentication**: Passport.js with OAuth strategies
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server
- OAuth app credentials for providers

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
Create a `.env` file in the root directory:
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration (MSSQL)
DB_HOST=your-db-host
DB_PORT=7400
DB_NAME=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OAuth Configuration
# Kakao
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback

# Naver
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_REDIRECT_URI=http://localhost:3000/auth/naver/callback

# Apple
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
APPLE_REDIRECT_URI=http://localhost:3000/auth/apple/callback

# Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints
 
### Authentication
- `GET /auth/kakao` - Start Kakao OAuth flow
- `GET /auth/kakao/callback` - Kakao OAuth callback
- `GET /auth/naver` - Start Naver OAuth flow
- `GET /auth/naver/callback` - Naver OAuth callback
- `GET /auth/apple` - Start Apple OAuth flow
- `POST /auth/apple/callback` - Apple OAuth callback
- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback

 
## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

### Kakao OAuth
1. Go to [Kakao Developers](https://developers.kakao.com/)
2. Create an application
3. Set redirect URI: `http://localhost:3000/auth/kakao/callback`
4. Get Client ID and Client Secret

### Naver OAuth
1. Go to [Naver Developers](https://developers.naver.com/)
2. Create an application
3. Set callback URL: `http://localhost:3000/auth/naver/callback`
4. Get Client ID and Client Secret

### Apple OAuth
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID
3. Create a Service ID
4. Generate a private key
5. Set redirect URI: `http://localhost:3000/auth/apple/callback`
 
## Development

### Code Style
- ESLint configuration for consistent code style
- Use `npm run lint` to check for issues
- Use `npm run lint:fix` to auto-fix issues
 
## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please contact the development team.
