# Lambda Layers for JAIIB-CAIIB Exam Prep Portal

This directory contains Lambda layer definitions for shared dependencies and utility functions used across all Lambda functions in the JAIIB-CAIIB Exam Prep Portal.

## Structure

```
lambda-layers/
├── common-dependencies/          # Layer for npm packages
│   ├── package.json
│   ├── package-lock.json
│   └── nodejs/
│       └── node_modules/         # Installed dependencies
├── utility-functions/            # Layer for shared utilities
│   ├── src/
│   │   ├── types.ts             # Shared TypeScript types
│   │   ├── constants.ts         # Shared constants
│   │   ├── encryption.ts        # Encryption utilities
│   │   ├── validation.ts        # Input validation
│   │   ├── error-handling.ts    # Error handling
│   │   ├── logging.ts           # CloudWatch logging
│   │   ├── index.ts             # Main export
│   │   └── __tests__/           # Unit tests
│   ├── dist/                    # Compiled output
│   │   └── nodejs/
│   │       └── node_modules/
│   │           └── shared-utils/
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
└── README.md
```

## Common Dependencies Layer

Contains npm packages shared across Lambda functions:

- **bcrypt** (v5.1.0+) - Password hashing
- **jsonwebtoken** (v9.0.0+) - JWT token generation/validation
- **aws-sdk** (v2.1400+) - AWS SDK for Node.js
- **axios** (v1.4.0+) - HTTP client
- **uuid** (v9.0.0+) - UUID generation
- **dotenv** (v16.0.0+) - Environment variable management

### Building

```bash
cd infrastructure/lambda-layers/common-dependencies
npm install --production
```

The layer will be packaged with the structure:
```
nodejs/
└── node_modules/
    ├── bcrypt/
    ├── jsonwebtoken/
    ├── aws-sdk/
    ├── axios/
    ├── uuid/
    └── dotenv/
```

## Utility Functions Layer

Contains shared TypeScript utilities compiled to JavaScript:

### Modules

#### types.ts
Shared TypeScript interfaces and types:
- `User` - User entity
- `Question` - MCQ question
- `PracticeSet` - Practice session
- `Score` - Score record
- `AuditLog` - Audit log entry
- `Explanation` - AI explanation
- `APIRequest` / `APIResponse` - API types
- `DashboardMetrics` - Dashboard data

#### constants.ts
Shared constants:
- JAIIB papers and names
- Difficulty levels
- User roles and status
- HTTP status codes
- Error codes
- DynamoDB table names
- Session configuration
- Password requirements
- Scoring configuration
- Rate limiting

#### encryption.ts
Encryption utilities using AES-256-GCM:
- `encrypt(plaintext, key)` - Encrypt data
- `decrypt(ciphertext, key)` - Decrypt data
- `generateKey()` - Generate random key
- `hash(data)` - SHA-256 hash
- `verifyHash(data, hash)` - Verify hash

#### validation.ts
Input validation functions:
- `validateEmail()` - RFC 5322 email validation
- `validatePassword()` - Password strength validation
- `validateUUID()` - UUID format validation
- `validateJAIIBPaper()` - JAIIB paper validation
- `validateDifficultyLevel()` - Difficulty level validation
- `validateMCQAnswer()` - MCQ answer validation
- `validateQuestionText()` - Question text validation
- `validateMCQOption()` - MCQ option validation
- `validateMCQOptionsUnique()` - Option uniqueness
- `validateUserRole()` - User role validation
- `validateFullName()` - Full name validation
- And more...

#### error-handling.ts
Custom error classes and utilities:
- `AppError` - Base error class
- `ValidationError` - 400 Bad Request
- `AuthenticationError` - 401 Unauthorized
- `AuthorizationError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict
- `InternalServerError` - 500 Internal Server Error
- `ServiceUnavailableError` - 503 Service Unavailable
- `DatabaseError` - Database operation error
- `formatErrorResponse()` - Format error for API response
- `formatSuccessResponse()` - Format success for API response

#### logging.ts
Structured logging utilities:
- `Logger` class - Structured logger with context
- `getLogger()` - Get global logger instance
- `createLogger()` - Create new logger instance
- `logLambdaEvent()` - Log Lambda event
- `logLambdaResponse()` - Log Lambda response
- `logLambdaError()` - Log Lambda error

### Building

```bash
cd infrastructure/lambda-layers/utility-functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Generate coverage report
npm run test:coverage
```

The layer will be packaged with the structure:
```
nodejs/
└── node_modules/
    └── shared-utils/
        ├── types.js
        ├── constants.js
        ├── encryption.js
        ├── validation.js
        ├── error-handling.js
        ├── logging.js
        └── index.js
```

## Using Layers in Lambda Functions

### In CDK

```typescript
import { LambdaLayers } from './lambda-layers';

const layers = new LambdaLayers(this, 'LambdaLayers', {
  environment: 'production',
});

const handler = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda-functions/my-function'),
  layers: layers.getLayers(),
});
```

### In Lambda Function Code

```typescript
// Import from common dependencies layer
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Import from utility functions layer
import {
  validateEmail,
  validatePassword,
  ValidationError,
  formatErrorResponse,
  formatSuccessResponse,
  Logger,
  JAIIB_PAPERS,
  HTTP_STATUS,
} from '/opt/nodejs/node_modules/shared-utils';

export async function handler(event: any) {
  const logger = new Logger({ requestId: event.requestContext.requestId });

  try {
    // Validate input
    if (!validateEmail(event.body.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Use utilities
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(event.body.password, 10);

    logger.info('User created', { userId });

    return formatSuccessResponse({ userId }, HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error('Error creating user', error);
    return formatErrorResponse(error);
  }
}
```

## Layer Versioning

Layers are versioned automatically by CDK. Each deployment creates a new version:
- Version 1, 2, 3, etc.
- Old versions are retained for rollback capability
- Lambda functions reference specific layer versions

## Testing

Run tests for utility functions:

```bash
cd infrastructure/lambda-layers/utility-functions

# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm run test:coverage
```

## Building All Layers

Use the build script to build both layers:

```bash
bash infrastructure/scripts/build-layers.sh
```

This script:
1. Installs common dependencies
2. Builds utility functions TypeScript
3. Creates layer ZIP files (optional)

## Performance Considerations

- **Layer Size**: Keep layers under 50MB uncompressed
- **Cold Start**: Layers add ~100-200ms to cold start time
- **Caching**: Lambda caches layer content, so updates require new versions
- **Dependency Management**: Use `--production` flag to exclude dev dependencies

## Security Considerations

- Encryption keys should be stored in AWS Secrets Manager
- Sensitive data should be encrypted before storage
- Validation should be performed on all inputs
- Error messages should not expose sensitive information
- Audit logs should be retained for compliance

## Troubleshooting

### Layer not found in Lambda function

1. Ensure layer is deployed: `cdk deploy`
2. Check layer ARN in Lambda function configuration
3. Verify layer version is compatible with Lambda runtime

### Import errors in Lambda function

1. Check layer structure: `nodejs/node_modules/`
2. Verify module names match imports
3. Check TypeScript compilation output

### Performance issues

1. Check layer size: `du -sh infrastructure/lambda-layers/*/`
2. Remove unused dependencies
3. Consider splitting into multiple layers

## References

- [AWS Lambda Layers Documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [AWS CDK Lambda Layers](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-lambda-readme.html#layers)
- [Node.js Lambda Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
