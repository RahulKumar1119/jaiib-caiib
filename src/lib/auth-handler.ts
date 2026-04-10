/**
 * Authentication Lambda Handler CDK Construct
 * Creates and configures the authentication Lambda function
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import { LambdaLayers } from './lambda-layers';
import { DynamoDBTables } from './dynamodb-tables';

export interface AuthHandlerProps {
  environment: string;
  lambdaLayers: LambdaLayers;
  dynamoDBTables: DynamoDBTables;
  logGroup: logs.LogGroup;
}

/**
 * Creates and configures the authentication Lambda function
 */
export class AuthHandler extends Construct {
  public readonly function: lambda.Function;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: AuthHandlerProps) {
    super(scope, id);

    // Create CloudWatch log group for Lambda
    this.logGroup = new logs.LogGroup(this, 'AuthHandlerLogGroup', {
      logGroupName: `/aws/lambda/${props.environment}/auth-handler`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Lambda function
    this.function = new lambda.Function(this, 'AuthHandlerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../handlers/auth/dist')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
        USERS_TABLE: props.dynamoDBTables.usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        JWT_EXPIRATION_MINUTES: '30',
        BCRYPT_SALT_ROUNDS: '10',
      },
      layers: props.lambdaLayers.getLayers(),
      logGroup: this.logGroup,
      description: 'Authentication handler for JAIIB-CAIIB Exam Prep Portal',
    });

    // Grant Lambda permissions to read/write to Users table
    props.dynamoDBTables.usersTable.grantReadWriteData(this.function);

    // Add tags
    cdk.Tags.of(this.function).add('Environment', props.environment);
    cdk.Tags.of(this.function).add('Service', 'AuthHandler');
    cdk.Tags.of(this.logGroup).add('Environment', props.environment);
  }

  /**
   * Integrates the Lambda function with API Gateway
   */
  public integrateWithApiGateway(api: apigateway.RestApi): void {
    const authResource = api.root.addResource('auth');

    // POST /auth/login
    const loginResource = authResource.addResource('login');
    const loginIntegration = new apigateway.LambdaIntegration(this.function);
    loginResource.addMethod('POST', loginIntegration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '500' },
      ],
    });

    // POST /auth/logout
    const logoutResource = authResource.addResource('logout');
    const logoutIntegration = new apigateway.LambdaIntegration(this.function);
    logoutResource.addMethod('POST', logoutIntegration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '401' },
        { statusCode: '500' },
      ],
    });

    // POST /auth/reset-password
    const resetPasswordResource = authResource.addResource('reset-password');
    const resetPasswordIntegration = new apigateway.LambdaIntegration(this.function);
    resetPasswordResource.addMethod('POST', resetPasswordIntegration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    });

    // POST /auth/verify-reset-token
    const verifyResetTokenResource = resetPasswordResource.addResource('verify');
    const verifyResetTokenIntegration = new apigateway.LambdaIntegration(this.function);
    verifyResetTokenResource.addMethod('POST', verifyResetTokenIntegration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '500' },
      ],
    });
  }

  /**
   * Gets the Lambda function ARN
   */
  public getFunctionArn(): string {
    return this.function.functionArn;
  }

  /**
   * Gets the Lambda function name
   */
  public getFunctionName(): string {
    return this.function.functionName;
  }
}
