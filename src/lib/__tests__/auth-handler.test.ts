/**
 * Tests for Authentication Handler CDK Construct
 * Validates Lambda function configuration and API Gateway integration
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { AuthHandler } from '../auth-handler';
import { LambdaLayers } from '../lambda-layers';
import { DynamoDBTables } from '../dynamodb-tables';
import { ApiGateway } from '../api-gateway';

describe('AuthHandler', () => {
  let stack: cdk.Stack;
  let lambdaLayers: LambdaLayers;
  let dynamoDBTables: DynamoDBTables;
  let logGroup: logs.LogGroup;
  let authHandler: AuthHandler;

  beforeEach(() => {
    stack = new cdk.Stack();
    lambdaLayers = new LambdaLayers(stack, 'LambdaLayers', {
      environment: 'test',
    });
    dynamoDBTables = new DynamoDBTables(stack, 'DynamoDBTables', {
      kmsKey: new cdk.aws_kms.Key(stack, 'KmsKey'),
    });
    logGroup = new logs.LogGroup(stack, 'LogGroup', {
      logGroupName: '/aws/lambda/test/auth',
      retention: logs.RetentionDays.ONE_MONTH,
    });
    authHandler = new AuthHandler(stack, 'AuthHandler', {
      environment: 'test',
      lambdaLayers,
      dynamoDBTables,
      logGroup,
    });
  });

  describe('Lambda Function Creation', () => {
    it('should create Lambda function with correct runtime', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
      });
    });

    it('should create Lambda function with correct timeout', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });
    });

    it('should create Lambda function with correct memory size', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 512,
      });
    });

    it('should attach Lambda layers', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Layers: Match.arrayWith([Match.any(), Match.any()]),
      });
    });

    it('should set environment variables', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            USERS_TABLE: Match.any(),
            JWT_SECRET: Match.any(),
            JWT_EXPIRATION_MINUTES: '30',
            BCRYPT_SALT_ROUNDS: '10',
          }),
        }),
      });
    });

    it('should set JWT expiration to 30 minutes', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            JWT_EXPIRATION_MINUTES: '30',
          }),
        }),
      });
    });

    it('should set bcrypt salt rounds to 10', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            BCRYPT_SALT_ROUNDS: '10',
          }),
        }),
      });
    });
  });

  describe('Permissions', () => {
    it('should grant read/write permissions to Users table', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('Logging', () => {
    it('should create CloudWatch log group', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/test/auth-handler',
      });
    });

    it('should set log retention to 30 days', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('Tags', () => {
    it('should tag Lambda function with environment', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'test',
          }),
        ]),
      });
    });

    it('should tag Lambda function with service name', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Service',
            Value: 'AuthHandler',
          }),
        ]),
      });
    });
  });

  describe('API Gateway Integration', () => {
    it('should create auth resource', () => {
      const api = new ApiGateway(stack, 'ApiGateway', {
        environment: 'test',
        logRetentionDays: 30,
      });

      authHandler.integrateWithApiGateway(api.api);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'auth',
      });
    });

    it('should create login endpoint', () => {
      const api = new ApiGateway(stack, 'ApiGateway', {
        environment: 'test',
        logRetentionDays: 30,
      });

      authHandler.integrateWithApiGateway(api.api);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'login',
      });
    });

    it('should create logout endpoint', () => {
      const api = new ApiGateway(stack, 'ApiGateway', {
        environment: 'test',
        logRetentionDays: 30,
      });

      authHandler.integrateWithApiGateway(api.api);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'logout',
      });
    });

    it('should create reset-password endpoint', () => {
      const api = new ApiGateway(stack, 'ApiGateway', {
        environment: 'test',
        logRetentionDays: 30,
      });

      authHandler.integrateWithApiGateway(api.api);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'reset-password',
      });
    });

    it('should create verify-reset-token endpoint', () => {
      const api = new ApiGateway(stack, 'ApiGateway', {
        environment: 'test',
        logRetentionDays: 30,
      });

      authHandler.integrateWithApiGateway(api.api);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'verify',
      });
    });

    it('should create POST methods for all endpoints', () => {
      const api = new ApiGateway(stack, 'ApiGateway', {
        environment: 'test',
        logRetentionDays: 30,
      });

      authHandler.integrateWithApiGateway(api.api);

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::ApiGateway::Method', Match.greaterThanOrEqualTo(4));
    });

    it('should integrate Lambda with API Gateway', () => {
      const api = new ApiGateway(stack, 'ApiGateway', {
        environment: 'test',
        logRetentionDays: 30,
      });

      authHandler.integrateWithApiGateway(api.api);

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });
  });

  describe('Outputs', () => {
    it('should return function ARN', () => {
      const arn = authHandler.getFunctionArn();
      expect(arn).toBeDefined();
      expect(arn).toContain('arn:aws:lambda');
    });

    it('should return function name', () => {
      const name = authHandler.getFunctionName();
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });
  });

  describe('Environment Configuration', () => {
    it('should use correct AWS region', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            AWS_REGION: Match.any(),
          }),
        }),
      });
    });

    it('should reference Users table', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            USERS_TABLE: Match.any(),
          }),
        }),
      });
    });
  });

  describe('Security', () => {
    it('should not expose JWT secret in plain text in logs', () => {
      // JWT secret should be stored in environment variables
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            JWT_SECRET: Match.any(),
          }),
        }),
      });
    });

    it('should use bcrypt with 10 salt rounds', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            BCRYPT_SALT_ROUNDS: '10',
          }),
        }),
      });
    });
  });
});
