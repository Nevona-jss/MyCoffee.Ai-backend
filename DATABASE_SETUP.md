# Database Setup Guide

## MSSQL Database Configuration

This project uses MSSQL (Microsoft SQL Server) as the database.

### Connection Details

- **Server**: db.jsdevdemo.com
- **Port**: 7400
- **Database**: COF
- **Username**: sadb
- **Password**: jss0905!!

### Configuration

The database configuration is located in `config/database.js` and uses environment variables for secure credential management.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DB_HOST=db.jsdevdemo.com
DB_PORT=7400
DB_NAME=COF
DB_USERNAME=sadb
DB_PASSWORD=jss0905!!
```

### Usage Examples

#### 1. Simple Query

```javascript
const db = require('./config/database');

// Execute a simple query
const result = await db.query('SELECT * FROM Users WHERE id = @id', {
  id: 123
});

console.log(result.recordset);
```

#### 2. Execute Stored Procedure

```javascript
const db = require('./config/database');

// Execute a stored procedure
const result = await db.executeProcedure('sp_GetUserById', {
  userId: 123
});

console.log(result.recordset);
```

#### 3. Using in Routes

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { ApiResponse } = require('../utils');

router.get('/users/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM Users WHERE id = @id',
      { id: req.params.id }
    );
    
    if (result.recordset.length === 0) {
      return ApiResponse.notFound(res, 'User not found');
    }
    
    ApiResponse.success(res, result.recordset[0], 'User retrieved successfully');
  } catch (error) {
    ApiResponse.error(res, 'Failed to retrieve user', 500, error);
  }
});

module.exports = router;
```

#### 4. Transaction Example

```javascript
const db = require('./config/database');

async function createUserWithProfile(userData, profileData) {
  const pool = await db.getPool();
  const transaction = pool.transaction();
  
  try {
    await transaction.begin();
    
    // Insert user
    const userResult = await transaction.request()
      .input('name', userData.name)
      .input('email', userData.email)
      .query('INSERT INTO Users (name, email) OUTPUT INSERTED.id VALUES (@name, @email)');
    
    const userId = userResult.recordset[0].id;
    
    // Insert profile
    await transaction.request()
      .input('userId', userId)
      .input('bio', profileData.bio)
      .query('INSERT INTO Profiles (userId, bio) VALUES (@userId, @bio)');
    
    await transaction.commit();
    
    return { success: true, userId };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### Available Functions

- **`getPool()`**: Get the database connection pool
- **`query(queryString, params)`**: Execute a SQL query with parameters
- **`executeProcedure(procedureName, params)`**: Execute a stored procedure
- **`testConnection()`**: Test the database connection
- **`closeConnection()`**: Close the database connection

### Testing the Connection

You can test the database connection by visiting:

```
http://localhost:3000/test-db
```

Or start the server and check the console for connection status:

```bash
npm run dev
```

You should see:
```
✅ Database initialized successfully
```

### SQL Server Data Types

When working with parameters, you can specify SQL Server data types:

```javascript
const { sql } = require('./config/database');

const result = await db.query(
  'INSERT INTO Users (name, email, age, createdAt) VALUES (@name, @email, @age, @createdAt)',
  {
    name: sql.NVarChar(100), 'John Doe',
    email: sql.NVarChar(255), 'john@example.com',
    age: sql.Int, 30,
    createdAt: sql.DateTime, new Date()
  }
);
```

### Common SQL Server Types

- `sql.Int` - Integer
- `sql.BigInt` - Big Integer
- `sql.VarChar(length)` - Variable character
- `sql.NVarChar(length)` - Unicode variable character
- `sql.Text` - Text
- `sql.Bit` - Boolean (0 or 1)
- `sql.DateTime` - DateTime
- `sql.Date` - Date
- `sql.Decimal(precision, scale)` - Decimal
- `sql.Money` - Money
- `sql.UniqueIdentifier` - GUID

### Troubleshooting

#### Connection Failed

If you see "Database connection failed", check:

1. Server address and port are correct
2. Firewall allows connection to port 7400
3. Database credentials are correct
4. Database server is running

#### Timeout Errors

Increase timeout values in `config/database.js`:

```javascript
options: {
  connectionTimeout: 60000,  // 60 seconds
  requestTimeout: 60000,
}
```

### Security Notes

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use environment variables** in production
3. **Enable encryption** for production databases
4. **Use stored procedures** to prevent SQL injection
5. **Parameterize all queries** - never concatenate user input

### Production Deployment

For production, update these settings in `config/database.js`:

```javascript
options: {
  encrypt: true,  // Enable encryption
  trustServerCertificate: false,  // Verify certificates
  // ... other options
}
```

And use environment variables instead of hardcoded values.
