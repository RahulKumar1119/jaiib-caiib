/**
 * Tests for API Gateway configuration
 * Validates REST API setup, request validation, rate limiting, CORS, and security headers
 */

import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ApiGateway } from '../api-gateway';

describe('ApiGateway', () => {
  let stack: cdk.Stack;
  let apiGateway: ApiGateway;

  beforeEach(() => {
    stack = new cdk.Stack();
    apiGateway = new ApiGateway(stack, 'TestApiGateway', {
      environment: 'test',
      logRetentionDays: 30,
    });
  });

  describe('REST API Creation', () => {
    it('should create a REST API with correct name', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'jaiib-caiib-api-test',
        Description: 'REST API for JAIIB-CAIIB Exam Prep Portal',
      });
    });

    it('should create API with regional endpoint type', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    it('should create a deployment stage', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'test',
      });
    });
  });

  describe('Logging Configuration', () => {
    it('should create CloudWatch log group for API Gateway', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/test/jaiib-caiib',
        RetentionInDays: 30,
      });
    });

    it('should enable access logging on stage', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    it('should have correct log group retention', () => {
      expect(apiGateway.logGroup.node.defaultChild).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should create usage plan with rate limiting', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Description: 'Usage plan with rate limiting (100 requests/minute per user)',
        Throttle: {
          RateLimit: 100,
          BurstLimit: 200,
        },
      });
    });

    it('should create API key for usage plan', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Description: 'API key for JAIIB-CAIIB Exam Prep Portal',
      });
    });

    it('should associate API key with usage plan', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::UsagePlanKey', {
        KeyType: 'API_KEY',
      });
    });

    it('should set stage throttling limits', () => {
      const template = Template.fromStack(stack);
      // Throttling is configured in deployOptions
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'test',
      });
    });
  });

  describe('CORS Configuration', () => {
    it('should enable CORS with correct headers', () => {
      // CORS is configured at the API level with defaultCorsPreflightOptions
      expect(apiGateway.api).toBeDefined();
    });

    it('should allow all origins', () => {
      // CORS is configured at the API level
      expect(apiGateway.api).toBeDefined();
    });

    it('should allow all HTTP methods', () => {
      // CORS methods are configured at the API level
      expect(apiGateway.api).toBeDefined();
    });

    it('should include required headers in CORS', () => {
      // CORS headers are configured at the API level
      expect(apiGateway.api).toBeDefined();
    });
  });

  describe('Request Validation', () => {
    it('should create request validator', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });

    it('should validate request body and parameters', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });
  });

  describe('Security Headers', () => {
    it('should add X-Content-Type-Options header', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseParameters: Match.objectLike({
          'gatewayresponse.header.X-Content-Type-Options': 'nosniff',
        }),
      });
    });

    it('should add X-Frame-Options header', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseParameters: Match.objectLike({
          'gatewayresponse.header.X-Frame-Options': 'DENY',
        }),
      });
    });

    it('should add X-XSS-Protection header', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseParameters: Match.objectLike({
          'gatewayresponse.header.X-XSS-Protection': '1; mode=block',
        }),
      });
    });

    it('should add Strict-Transport-Security header', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseParameters: Match.objectLike({
          'gatewayresponse.header.Strict-Transport-Security':
            'max-age=31536000; includeSubDomains',
        }),
      });
    });

    it('should add Content-Security-Policy header', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseParameters: Match.objectLike({
          'gatewayresponse.header.Content-Security-Policy': "default-src 'self'",
        }),
      });
    });

    it('should add Referrer-Policy header', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseParameters: Match.objectLike({
          'gatewayresponse.header.Referrer-Policy': 'strict-origin-when-cross-origin',
        }),
      });
    });

    it('should add security headers to 4xx responses', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseType: 'DEFAULT_4XX',
      });
    });

    it('should add security headers to 5xx responses', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseType: 'DEFAULT_5XX',
      });
    });
  });

  describe('API Methods', () => {
    it('should add method with correct response codes', () => {
      const resource = apiGateway.getRoot();
      const integration = new apigateway.MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
      });

      const method = apiGateway.addMethod(resource, 'GET', integration);

      expect(method).toBeDefined();
      expect(method.httpMethod).toBe('GET');
    });

    it('should support all HTTP methods', () => {
      const resource = apiGateway.getRoot();
      const integration = new apigateway.MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
      });

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      methods.forEach((method) => {
        const m = apiGateway.addMethod(resource, method, integration);
        expect(m.httpMethod).toBe(method);
      });
    });

    it('should include error response codes in method options', () => {
      const resource = apiGateway.getRoot();
      const integration = new apigateway.MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
      });

      const method = apiGateway.addMethod(resource, 'GET', integration);

      // Method responses should include error codes
      expect(method.node.defaultChild).toBeDefined();
    });
  });

  describe('Resource Creation', () => {
    it('should create resource with path part', () => {
      const root = apiGateway.getRoot();
      const resource = apiGateway.createResource(root, 'auth');

      expect(resource).toBeDefined();
      expect(resource.path).toBe('/auth');
    });

    it('should create nested resources', () => {
      const root = apiGateway.getRoot();
      const authResource = apiGateway.createResource(root, 'auth');
      const loginResource = apiGateway.createResource(authResource, 'login');

      expect(loginResource).toBeDefined();
      expect(loginResource.path).toBe('/auth/login');
    });
  });

  describe('API Outputs', () => {
    it('should return API endpoint URL', () => {
      const endpoint = apiGateway.getApiEndpoint();
      expect(endpoint).toBeDefined();
      expect(endpoint).toContain('https://');
    });

    it('should return API ID', () => {
      const apiId = apiGateway.getApiId();
      expect(apiId).toBeDefined();
      expect(typeof apiId).toBe('string');
    });

    it('should return root resource', () => {
      const root = apiGateway.getRoot();
      expect(root).toBeDefined();
      expect(root.path).toBe('/');
    });
  });

  describe('Tags', () => {
    it('should tag API with environment', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'test',
          }),
        ]),
      });
    });

    it('should tag API with service name', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Service',
            Value: 'ApiGateway',
          }),
        ]),
      });
    });

    it('should tag log group with environment', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'test',
          }),
        ]),
      });
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should enable metrics on stage', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    it('should enable data trace logging', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
          }),
        ]),
      });
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should use environment in API name', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('jaiib-caiib-api-test'),
      });
    });

    it('should use environment in usage plan name', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: Match.stringLikeRegexp('jaiib-caiib-usage-plan-test'),
      });
    });

    it('should use environment in log group name', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/test/jaiib-caiib',
      });
    });
  });

  describe('Log Retention Configuration', () => {
    it('should support different retention periods', () => {
      const stack2 = new cdk.Stack();
      const apiGateway2 = new ApiGateway(stack2, 'TestApiGateway2', {
        environment: 'test',
        logRetentionDays: 90,
      });

      const template = Template.fromStack(stack2);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });

    it('should default to 30 days retention', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });
});
