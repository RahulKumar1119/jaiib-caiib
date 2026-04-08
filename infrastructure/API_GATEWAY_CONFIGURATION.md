# API Gateway Configuration

## Overview

This document describes the API Gateway configuration for the JAIIB-CAIIB Exam Prep Portal. The API Gateway provides a secure, scalable REST API with request validation, rate limiting, CORS support, and comprehensive security headers.

## Architecture

### REST API Setup

- **Endpoint Type**: Regional (single region deployment)
- **API Name**: `jaiib-caiib-api-{environment}`
- **Description**: REST API for JAIIB-CAIIB Exam Prep Portal
- **Deployment Stage**: Environment-specific (development, staging, production)

### Key Features

1. **Request Validation**
   - Validates request body and parameters
   - Returns 400 Bad Request for invalid requests
   - Prevents malformed data from reaching Lambda functions

2. **Rate Limiting**
   - 100 requests per minute per user (via API key)
   - Burst limit of 200 requests
   - Prevents abuse and ensures fair resource usage

3. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000; includeSubDomains
   - Content-Security-Policy: default-src 'self'
   - Referrer-Policy: strict-origin-when-cross-origin

4. **CORS Configuration**
   - Allows all origins (configurable)
   - Allows all HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
   - Includes required headers for authentication and API communication
   - Max age: 1 day

5. **Logging and Monitoring**
   - CloudWatch log group: `/aws/apigateway/{environment}/jaiib-caiib`
   - Access logging enabled with detailed request/response information
   - Metrics enabled for all methods
   - Data trace enabled for debugging

## Configuration Details

### Rate Limiting

The API uses AWS API Gateway usage plans to enforce rate limiting:

```
Rate Limit: 100 requests/minute per user
Burst Limit: 200 requests
```

This is enforced via API keys. Each user/tenant should have a unique API key.

### Request Validation

All endpoints support request validation:

- **Request Body Validation**: Validates JSON structure and required fields
- **Request Parameter Validation**: Validates query parameters and path parameters
- **Response Codes**: 
  - 200: Success
  - 400: Bad Request (validation error)
  - 401: Unauthorized (authentication error)
  - 403: Forbidden (authorization error)
  - 404: Not Found
  - 429: Too Many Requests (rate limit exceeded)
  - 500: Internal Server Error

### Logging

Access logs include:

- HTTP method
- Resource path
- Request time
- Response status code
- Response length
- Caller IP address
- Protocol (HTTP/HTTPS)
- User information

Logs are stored in CloudWatch with configurable retention (default: 30 days).

### Security

#### HTTPS/TLS

- All traffic is encrypted in transit using TLS 1.2+
- Enforced via Strict-Transport-Security header

#### CORS

- Configured to allow cross-origin requests from specified origins
- Supports preflight requests (OPTIONS method)
- Includes required headers for authentication

#### Security Headers

All responses include security headers to prevent common attacks:

- **XSS Protection**: X-XSS-Protection header
- **Clickjacking Protection**: X-Frame-Options header
- **MIME Type Sniffing**: X-Content-Type-Options header
- **Content Security Policy**: Restricts resource loading
- **Referrer Policy**: Controls referrer information

## Usage

### Creating Resources

```typescript
const root = apiGateway.getRoot();
const authResource = apiGateway.createResource(root, 'auth');
const loginResource = apiGateway.createResource(authResource, 'login');
```

### Adding Methods

```typescript
const integration = new apigateway.LambdaIntegration(loginHandler);
apiGateway.addMethod(loginResource, 'POST', integration);
```

### Getting API Information

```typescript
const endpoint = apiGateway.getApiEndpoint();  // https://xxxxx.execute-api.ap-south-1.amazonaws.com/environment
const apiId = apiGateway.getApiId();           // xxxxx
```

## Environment-Specific Configuration

### Development

- Log retention: 7 days
- Metrics enabled
- Data trace enabled
- Rate limit: 100 requests/minute

### Staging

- Log retention: 30 days
- Metrics enabled
- Data trace enabled
- Rate limit: 100 requests/minute

### Production

- Log retention: 90 days
- Metrics enabled
- Data trace disabled (for performance)
- Rate limit: 100 requests/minute

## Monitoring and Alerts

### CloudWatch Metrics

- **Count**: Number of API calls
- **4XXError**: Number of 4xx errors
- **5XXError**: Number of 5xx errors
- **Latency**: API response time
- **IntegrationLatency**: Lambda execution time

### Recommended Alarms

1. **Error Rate > 1%**: Alert if error rate exceeds 1%
2. **Latency p95 > 1s**: Alert if 95th percentile latency exceeds 1 second
3. **Rate Limit Exceeded**: Alert if rate limit is frequently exceeded
4. **5xx Errors**: Alert on any 5xx errors

## API Key Management

### Creating API Keys

API keys are created automatically during stack deployment. Each tenant should have a unique API key.

### Rotating API Keys

1. Create a new API key
2. Update the tenant configuration with the new key
3. Disable the old API key
4. Delete the old API key after verification

### Revoking API Keys

1. Disable the API key in AWS Console
2. Update the tenant configuration
3. Delete the API key after verification

## Troubleshooting

### 429 Too Many Requests

- User has exceeded the rate limit (100 requests/minute)
- Solution: Implement exponential backoff in client
- Check CloudWatch logs for request patterns

### 400 Bad Request

- Request validation failed
- Check request body and parameters
- Verify Content-Type header is set to application/json

### 401 Unauthorized

- Missing or invalid authentication token
- Verify JWT token is included in Authorization header
- Check token expiration

### 403 Forbidden

- User does not have permission to access the resource
- Verify tenant_id matches the user's tenant
- Check role-based access control rules

### 500 Internal Server Error

- Lambda function error
- Check CloudWatch logs for Lambda errors
- Verify Lambda function configuration

## Best Practices

1. **Use API Keys**: Always use API keys for rate limiting and tracking
2. **Implement Retry Logic**: Use exponential backoff for retries
3. **Monitor Metrics**: Set up CloudWatch alarms for key metrics
4. **Log Requests**: Log all API requests for debugging
5. **Validate Input**: Validate all input on the client side before sending
6. **Handle Errors**: Implement proper error handling for all error codes
7. **Use HTTPS**: Always use HTTPS for API calls
8. **Secure Tokens**: Store JWT tokens securely (HttpOnly cookies or secure storage)

## CDK Implementation

The API Gateway is implemented using AWS CDK in `src/lib/api-gateway.ts`:

```typescript
const apiGateway = new ApiGateway(stack, 'ApiGateway', {
  environment: 'production',
  logRetentionDays: 90,
});
```

### Properties

- `environment`: Deployment environment (development, staging, production)
- `logRetentionDays`: CloudWatch log retention in days

### Outputs

- `api`: RestApi construct
- `logGroup`: CloudWatch LogGroup for API Gateway logs

## Integration with Lambda Functions

Lambda functions are integrated with API Gateway using Lambda integrations:

```typescript
const handler = new lambda.Function(stack, 'LoginHandler', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('src/handlers/auth'),
});

const integration = new apigateway.LambdaIntegration(handler);
apiGateway.addMethod(loginResource, 'POST', integration);
```

## Testing

API Gateway configuration is tested using AWS CDK assertions:

```bash
npm test -- src/lib/__tests__/api-gateway.test.ts
```

Tests cover:
- REST API creation
- Logging configuration
- Rate limiting
- CORS configuration
- Request validation
- Security headers
- API methods
- Resource creation
- API outputs
- Tags
- Metrics and monitoring
- Environment-specific configuration
- Log retention configuration

## References

- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS CDK API Gateway](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigateway-readme.html)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [CORS Specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
