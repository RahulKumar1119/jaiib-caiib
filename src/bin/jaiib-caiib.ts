#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { JaiibCaiibStack } from '../lib/jaiib-caiib-stack';

// Load environment variables
dotenv.config();

const app = new cdk.App();

const environment = process.env.ENVIRONMENT || 'development';
const region = process.env.AWS_REGION || 'ap-south-1';
const logRetentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);

const stack = new JaiibCaiibStack(app, 'JaiibCaiibStack', {
  environment,
  region,
  logRetentionDays,
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region,
  },
  description: 'AWS CDK stack for JAIIB-CAIIB Exam Prep Portal infrastructure',
});

// Add stack outputs
new cdk.CfnOutput(stack, 'VpcId', {
  value: stack.vpc.vpcId,
  description: 'VPC ID for the JAIIB-CAIIB infrastructure',
  exportName: 'JaiibCaiibVpcId',
});

new cdk.CfnOutput(stack, 'KmsKeyId', {
  value: stack.kmsKey.keyId,
  description: 'KMS Key ID for encryption',
  exportName: 'JaiibCaiibKmsKeyId',
});

new cdk.CfnOutput(stack, 'LambdaLogGroupName', {
  value: stack.lambdaLogGroup.logGroupName,
  description: 'CloudWatch Log Group for Lambda functions',
  exportName: 'JaiibCaiibLambdaLogGroup',
});

new cdk.CfnOutput(stack, 'PrivateSubnets', {
  value: stack.vpc.privateSubnets.map((subnet) => subnet.subnetId).join(','),
  description: 'Private subnet IDs',
  exportName: 'JaiibCaiibPrivateSubnets',
});

new cdk.CfnOutput(stack, 'PublicSubnets', {
  value: stack.vpc.publicSubnets.map((subnet) => subnet.subnetId).join(','),
  description: 'Public subnet IDs',
  exportName: 'JaiibCaiibPublicSubnets',
});

new cdk.CfnOutput(stack, 'ApiGatewayEndpoint', {
  value: stack.apiGateway.getApiEndpoint(),
  description: 'API Gateway endpoint URL',
  exportName: 'JaiibCaiibApiEndpoint',
});

new cdk.CfnOutput(stack, 'ApiGatewayId', {
  value: stack.apiGateway.getApiId(),
  description: 'API Gateway ID',
  exportName: 'JaiibCaiibApiId',
});
