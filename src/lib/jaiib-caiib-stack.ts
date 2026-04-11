import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { DynamoDBTables } from './dynamodb-tables';
import { LambdaLayers } from './lambda-layers';
import { ApiGateway } from './api-gateway';

export interface JaiibCaiibStackProps extends cdk.StackProps {
  environment: string;
  region: string;
  logRetentionDays: number;
}

export class JaiibCaiibStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly lambdaLogGroup: logs.LogGroup;
  public readonly dynamoDBTables: DynamoDBTables;
  public readonly lambdaLayers: LambdaLayers;
  public readonly apiGateway: ApiGateway;

  constructor(scope: Construct, id: string, props: JaiibCaiibStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'JaiibCaiibKmsKey', {
      description: 'KMS key for JAIIB-CAIIB Exam Prep Portal encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.kmsKey.addAlias('jaiib-caiib-key');

    // Allow CloudWatch Logs to use the KMS key
    this.kmsKey.grantEncryptDecrypt(
      new iam.ServicePrincipal(`logs.${props.region}.amazonaws.com`)
    );

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'JaiibCaiibVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create CloudWatch log group for Lambda functions
    this.lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${props.environment}/jaiib-caiib`,
      retention: this.getRetentionDays(props.logRetentionDays),
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create DynamoDB tables
    this.dynamoDBTables = new DynamoDBTables(this, 'DynamoDBTables', {
      kmsKey: this.kmsKey,
    });

    // Create Lambda layers
    this.lambdaLayers = new LambdaLayers(this, 'LambdaLayers', {
      environment: props.environment,
    });

    // Create API Gateway with security and rate limiting
    this.apiGateway = new ApiGateway(this, 'ApiGateway', {
      environment: props.environment,
      logRetentionDays: props.logRetentionDays,
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Application', 'jaiib-caiib-exam-prep-portal');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Add stack outputs
    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      description: 'API Gateway endpoint URL',
      value: this.apiGateway.getApiEndpoint(),
      exportName: 'JaiibCaiibApiEndpoint',
    });
  }

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
