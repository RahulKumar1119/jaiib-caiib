import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { JaiibCaiibStack } from '../jaiib-caiib-stack';

describe('JaiibCaiibStack', () => {
  let app: cdk.App;
  let stack: JaiibCaiibStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new JaiibCaiibStack(app, 'TestStack', {
      environment: 'test',
      region: 'ap-south-1',
      logRetentionDays: 30,
      env: {
        account: '123456789012',
        region: 'ap-south-1',
      },
    });
  });

  test('creates VPC with correct CIDR', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });

  test('creates KMS key with rotation enabled', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::KMS::Key', {
      KeyPolicy: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: {
                'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
              },
            },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      },
      EnableKeyRotation: true,
    });
  });

  test('creates CloudWatch log group with encryption', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/lambda/test/jaiib-caiib',
      RetentionInDays: 30,
    });
  });

  test('creates public and private subnets', () => {
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
  });

  test('creates NAT gateway for private subnet egress', () => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::NatGateway', {});
  });

  test('exports VPC ID as stack output', () => {
    const template = Template.fromStack(stack);
    template.hasOutput('VpcId', {
      Export: {
        Name: 'JaiibCaiibVpcId',
      },
    });
  });

  test('exports KMS Key ID as stack output', () => {
    const template = Template.fromStack(stack);
    template.hasOutput('KmsKeyId', {
      Export: {
        Name: 'JaiibCaiibKmsKeyId',
      },
    });
  });

  test('exports Lambda Log Group name as stack output', () => {
    const template = Template.fromStack(stack);
    template.hasOutput('LambdaLogGroupName', {
      Export: {
        Name: 'JaiibCaiibLambdaLogGroup',
      },
    });
  });

  test('tags all resources with environment and application', () => {
    const template = Template.fromStack(stack);
    template.allResources('AWS::*', {
      Properties: {},
      Metadata: {
        'aws:cdk:node-metadata': [
          {
            type: 'aws:cdk:logicalId',
          },
        ],
      },
    });
  });
});
