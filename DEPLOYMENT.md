# Deployment Guide - JAIIB-CAIIB Exam Prep Portal

This guide provides step-by-step instructions for deploying the AWS CDK infrastructure for the JAIIB-CAIIB Exam Prep Portal.

## Prerequisites

### AWS Account Setup
1. Create an AWS account or use an existing one
2. Create an IAM user with programmatic access
3. Attach the following policies:
   - `AdministratorAccess` (for initial setup) or specific policies for:
     - EC2 (VPC, subnets, NAT gateways)
     - KMS (key creation and management)
     - CloudWatch Logs
     - CloudFormation
     - IAM (role creation)

### Local Environment Setup
1. Install Node.js 18+ and npm
2. Install AWS CLI: `pip install awscli`
3. Install AWS CDK CLI: `npm install -g aws-cdk`
4. Configure AWS credentials:
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, region (ap-south-1), and output format (json)

## Deployment Steps

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone <repository-url>
cd jaiib-caiib-exam-prep-portal

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your AWS account details
# Required variables:
# - AWS_ACCOUNT_ID: Your 12-digit AWS account ID
# - AWS_REGION: ap-south-1 (or your preferred region)
# - ENVIRONMENT: development, staging, or production
```

To find your AWS Account ID:
```bash
aws sts get-caller-identity --query Account --output text
```

### Step 3: Bootstrap CDK (First Time Only)

CDK requires bootstrapping to set up resources in your AWS account:

```bash
# Bootstrap for your account and region
cdk bootstrap aws://<ACCOUNT_ID>/ap-south-1

# Example:
cdk bootstrap aws://123456789012/ap-south-1
```

### Step 4: Build the Project

```bash
npm run build
```

### Step 5: Review the Stack

```bash
# See what resources will be created
npm run cdk:diff
```

Review the output to ensure all resources are as expected.

### Step 6: Deploy the Stack

```bash
# Deploy to AWS
npm run cdk:deploy

# For non-interactive deployment (CI/CD):
npm run cdk:deploy -- --require-approval never
```

When prompted, confirm the deployment by typing `y`.

### Step 7: Verify Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name JaiibCaiibStack \
  --region ap-south-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name JaiibCaiibStack \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs'
```

## Environment-Specific Deployments

### Development Deployment

```bash
# Load development environment
export $(cat .env.development | xargs)

# Deploy
npm run cdk:deploy
```

### Staging Deployment

```bash
# Load staging environment
export $(cat .env.staging | xargs)

# Deploy
npm run cdk:deploy
```

### Production Deployment

```bash
# Load production environment
export $(cat .env.production | xargs)

# Deploy with approval requirement
npm run cdk:deploy
```

## Post-Deployment Configuration

### 1. Verify VPC Configuration

```bash
# Get VPC ID from stack outputs
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name JaiibCaiibStack \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' \
  --output text)

# Verify VPC
aws ec2 describe-vpcs --vpc-ids $VPC_ID --region ap-south-1
```

### 2. Verify KMS Key

```bash
# Get KMS Key ID from stack outputs
KMS_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name JaiibCaiibStack \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`KmsKeyId`].OutputValue' \
  --output text)

# Verify KMS key
aws kms describe-key --key-id $KMS_KEY_ID --region ap-south-1
```

### 3. Verify CloudWatch Log Group

```bash
# Get Log Group name from stack outputs
LOG_GROUP=$(aws cloudformation describe-stacks \
  --stack-name JaiibCaiibStack \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaLogGroupName`].OutputValue' \
  --output text)

# Verify log group
aws logs describe-log-groups \
  --log-group-name-prefix $LOG_GROUP \
  --region ap-south-1
```

## Updating the Stack

To update the infrastructure after making changes:

```bash
# Build changes
npm run build

# Review changes
npm run cdk:diff

# Deploy updates
npm run cdk:deploy
```

## Destroying the Stack

To remove all resources (WARNING: This will delete all infrastructure):

```bash
# Destroy the stack
cdk destroy

# Confirm deletion when prompted
```

## Troubleshooting

### Bootstrap Errors

**Error**: `User: arn:aws:iam::... is not authorized to perform: cloudformation:CreateStack`

**Solution**: Ensure your IAM user has CloudFormation permissions. Add the `CloudFormationFullAccess` policy.

### VPC Creation Fails

**Error**: `VPC limit exceeded`

**Solution**: Check AWS Service Quotas for EC2 VPCs. Request a quota increase if needed.

### KMS Key Creation Fails

**Error**: `User is not authorized to perform: kms:CreateKey`

**Solution**: Ensure your IAM user has KMS permissions. Add the `KMSFullAccess` policy.

### CDK Synth Errors

**Error**: `Cannot find module 'aws-cdk-lib'`

**Solution**: Run `npm install` to install dependencies.

### Deployment Timeout

**Error**: Stack creation times out

**Solution**: 
- Check AWS CloudFormation console for detailed error messages
- Verify network connectivity
- Try deploying again

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy CDK Stack

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Deploy CDK Stack
        run: npm run cdk:deploy -- --require-approval never
```

## Monitoring and Maintenance

### CloudWatch Monitoring

Monitor your infrastructure through CloudWatch:

```bash
# View Lambda logs
aws logs tail /aws/lambda/development/jaiib-caiib --follow --region ap-south-1
```

### Cost Optimization

- Use DynamoDB on-demand billing for variable workloads
- Set appropriate log retention periods
- Monitor NAT gateway data transfer costs
- Use VPC endpoints for AWS service access to reduce NAT costs

## Support and Documentation

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/)

## Next Steps

After successful deployment of the core infrastructure:

1. Deploy DynamoDB tables (Task 2)
2. Set up Lambda layers (Task 3)
3. Configure API Gateway (Task 4)
4. Implement Lambda functions (Tasks 5+)

Refer to the main README.md for the complete implementation roadmap.
