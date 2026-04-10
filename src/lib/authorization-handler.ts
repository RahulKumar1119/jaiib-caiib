/**
 * Authorization Handler CDK Construct
 * Creates Lambda function for API Gateway authorization
 * Validates tenant_id and role-based access control
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface AuthorizationHandlerProps {
  environment: string;
  lambdaLayers: lambda.ILayerVersion[];
  usersTable: any;
  logRetentionDays: number;
}

export interface AuthorizationHandlerOutput {
  authorizerFunction: lambda.Function;
  authorizer: apigateway.TokenAuthorizer;
}

/**
 * Creates authorization Lambda function and API Gateway authorizer
 */
export class AuthorizationHandler extends Construct {
  public readonly authorizerFunction: lambda.Function;
  public readonly authorizer: apigateway.TokenAuthorizer;

  constructor(scope: Construct, id: string, props: AuthorizationHandlerProps) {
    super(scope, id);

    // Create CloudWatch log group for authorizer
    const logGroup = new logs.LogGroup(this, 'AuthorizerLogGroup', {
      logGroupName: `/aws/lambda/authorizer-${props.environment}`,
      retention: this.getRetentionDays(props.logRetentionDays),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create authorization Lambda function
    this.authorizerFunction = new lambda.Function(this, 'AuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.authorizer',
      code: lambda.Code.fromAsset('src/middleware', {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash',
            '-c',
            'npm install && npm run build && cp -r dist/* /asset-output/',
          ],
        },
      }),
      layers: props.lambdaLayers,
      environment: {
        USERS_TABLE: props.usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
        LOG_LEVEL: 'INFO',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup,
      description: 'Authorization handler for multi-tenant access control',
    });

    // Grant read access to users table
    props.usersTable.grantReadData(this.authorizerFunction);

    // Create API Gateway authorizer
    this.authorizer = new apigateway.TokenAuthorizer(this, 'Authorizer', {
      handler: this.authorizerFunction,
      identitySource: 'method.request.header.Authorization',
      authorizerName: `jaiib-caiib-authorizer-${props.environment}`,
      resultsCacheTtl: cdk.Duration.seconds(300),
    });

    // Add tags
    cdk.Tags.of(this.authorizerFunction).add('Environment', props.environment);
    cdk.Tags.of(this.authorizerFunction).add('Service', 'Authorization');
  }

  /**
   * Converts log retention days to CDK RetentionDays enum
   */
  private getRetentionDays(days: number): logs.RetentionDays {
    const retentionMap: { [key: number]: logs.RetentionDays } = {
      1: logs.RetentionDays.ONE_DAY,
      3: logs.RetentionDays.THREE_DAYS,
      5: logs.RetentionDays.FIVE_DAYS,
      7: logs.RetentionDays.ONE_WEEK,
      14: logs.RetentionDays.TWO_WEEKS,
      30: logs.RetentionDays.ONE_MONTH,
      60: logs.RetentionDays.TWO_MONTHS,
      90: logs.RetentionDays.THREE_MONTHS,
      180: logs.RetentionDays.SIX_MONTHS,
      365: logs.RetentionDays.ONE_YEAR,
    };

    return retentionMap[days] || logs.RetentionDays.ONE_MONTH;
  }
}
