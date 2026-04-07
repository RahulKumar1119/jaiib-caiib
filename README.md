# JAIIB-CAIIB Exam Prep Portal - AWS CDK Infrastructure

This project contains the AWS CDK infrastructure code for the JAIIB-CAIIB Exam Prep Portal, a full-stack web application for bank officers to prepare for IIBF certification exams.

## Project Structure

```
.
├── src/
│   ├── bin/
│   │   └── jaiib-caiib.ts          # CDK app entry point
│   └── lib/
│       ├── index.ts                 # Library exports
│       └── jaiib-caiib-stack.ts    # Main stack definition
├── cdk.json                         # CDK configuration
├── package.json                     # Node.js dependencies
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with credentials
- AWS CDK CLI installed globally: `npm install -g aws-cdk`
- AWS account with appropriate permissions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your AWS configuration:
- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_REGION`: AWS region (default: ap-south-1)
- `ENVIRONMENT`: Deployment environment (development, staging, production)
- `LOG_RETENTION_DAYS`: CloudWatch log retention period

### 3. Bootstrap CDK (First Time Only)

If this is your first time using CDK in this AWS account/region:

```bash
cdk bootstrap aws://<ACCOUNT_ID>/ap-south-1
```

### 4. Build the Project

```bash
npm run build
```

### 5. Review the Stack

```bash
npm run cdk:diff
```

This shows what resources will be created.

### 6. Deploy the Stack

```bash
npm run cdk:deploy
```

Confirm the deployment when prompted.

## Infrastructure Components

### VPC (Virtual Private Cloud)
- CIDR: 10.0.0.0/16
- 2 Availability Zones (ap-south-1a, ap-south-1b)
- Public subnets for NAT gateways
- Private subnets for Lambda functions and databases
- NAT gateway for outbound internet access from private subnets

### KMS Encryption
- Customer-managed KMS key for data encryption
- Automatic key rotation enabled
- Used for encrypting DynamoDB tables and CloudWatch logs

### CloudWatch Logging
- Centralized log group for all Lambda functions
- Log group name: `/aws/lambda/{environment}/jaiib-caiib`
- Configurable retention period (default: 30 days)
- Encrypted with KMS key

## Useful Commands

```bash
# Build TypeScript
npm run build

# Watch for changes
npm run watch

# Run tests
npm run test

# Synthesize CloudFormation template
npm run cdk:synth

# Show differences between current and deployed stack
npm run cdk:diff

# Deploy the stack
npm run cdk:deploy

# Destroy the stack
cdk destroy
```

## Stack Outputs

After deployment, the stack outputs the following values:

- **VpcId**: VPC ID for the infrastructure
- **KmsKeyId**: KMS Key ID for encryption
- **LambdaLogGroupName**: CloudWatch Log Group name
- **PrivateSubnets**: Comma-separated list of private subnet IDs
- **PublicSubnets**: Comma-separated list of public subnet IDs

These outputs can be referenced by other stacks or used for manual configuration.

## Next Steps

After deploying the core infrastructure, the following tasks will build on this foundation:

1. Create DynamoDB tables with proper schema and indexes
2. Set up Lambda layers and shared dependencies
3. Configure API Gateway with security and rate limiting
4. Implement authentication Lambda function
5. And more...

## Security Considerations

- All data is encrypted at rest using AWS KMS
- VPC provides network isolation
- Private subnets prevent direct internet access to databases
- CloudWatch logs are encrypted
- Enable MFA for AWS account access
- Regularly rotate KMS keys (automatic)
- Use IAM roles with least privilege principle

## Troubleshooting

### CDK Bootstrap Issues
If you encounter bootstrap errors, ensure your AWS credentials are configured:
```bash
aws sts get-caller-identity
```

### VPC Creation Fails
Ensure your AWS account has sufficient VPC limits. Check AWS Service Quotas console.

### Permission Denied Errors
Verify your IAM user/role has permissions for:
- EC2 (VPC, subnets, NAT gateways)
- KMS (key creation and management)
- CloudWatch Logs
- CloudFormation

## Support

For issues or questions, refer to:
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)

## License

MIT
