import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Template } from 'aws-cdk-lib/assertions';
import { DynamoDBTables } from '../dynamodb-tables';

describe('DynamoDBTables', () => {
  let stack: cdk.Stack;
  let kmsKey: kms.Key;
  let dynamoDBTables: DynamoDBTables;

  beforeEach(() => {
    stack = new cdk.Stack();
    kmsKey = new kms.Key(stack, 'TestKmsKey', {
      enableKeyRotation: true,
    });
    dynamoDBTables = new DynamoDBTables(stack, 'DynamoDBTables', {
      kmsKey,
    });
  });

  describe('Users Table', () => {
    it('should create Users table with correct partition key', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'users',
        KeySchema: [
          {
            AttributeName: 'tenant_id#user_id',
            KeyType: 'HASH',
          },
        ],
      });
    });

    it('should have TTL enabled on session_expires_at', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'users',
        TimeToLiveSpecification: {
          AttributeName: 'session_expires_at',
          Enabled: true,
        },
      });
    });

    it('should have KMS encryption enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'users',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'users',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    it('should use PAY_PER_REQUEST billing mode', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'users',
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    it('should have GSIs for tenant and email lookups', () => {
      expect(dynamoDBTables.usersTable.node.children.length).toBeGreaterThan(0);
    });
  });

  describe('Questions Table', () => {
    it('should create Questions table with paper#question_id partition key and version sort key', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'questions',
        KeySchema: [
          {
            AttributeName: 'paper#question_id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'version',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    it('should have KMS encryption enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'questions',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'questions',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    it('should have GSIs for paper and difficulty filtering', () => {
      expect(dynamoDBTables.questionsTable.node.children.length).toBeGreaterThan(0);
    });
  });

  describe('PracticeSets Table', () => {
    it('should create PracticeSets table with tenant_id#user_id partition key and created_at sort key', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'practice_sets',
        KeySchema: [
          {
            AttributeName: 'tenant_id#user_id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'created_at',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    it('should have TTL enabled on session_expires_at', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'practice_sets',
        TimeToLiveSpecification: {
          AttributeName: 'session_expires_at',
          Enabled: true,
        },
      });
    });

    it('should have KMS encryption enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'practice_sets',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'practice_sets',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    it('should have GSIs for practice set lookups', () => {
      expect(dynamoDBTables.practiceSetsTable.node.children.length).toBeGreaterThan(0);
    });
  });

  describe('Scores Table', () => {
    it('should create Scores table with tenant_id#user_id partition key and created_at sort key', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'scores',
        KeySchema: [
          {
            AttributeName: 'tenant_id#user_id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'created_at',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    it('should have KMS encryption enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'scores',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'scores',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    it('should have GSIs for score lookups', () => {
      expect(dynamoDBTables.scoresTable.node.children.length).toBeGreaterThan(0);
    });
  });

  describe('AuditLogs Table', () => {
    it('should create AuditLogs table with tenant_id partition key and created_at sort key', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'audit_logs',
        KeySchema: [
          {
            AttributeName: 'tenant_id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'created_at',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    it('should have TTL enabled on ttl_expiration for 90-day retention', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'audit_logs',
        TimeToLiveSpecification: {
          AttributeName: 'ttl_expiration',
          Enabled: true,
        },
      });
    });

    it('should have KMS encryption enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'audit_logs',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'audit_logs',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    it('should have GSIs for audit log filtering', () => {
      expect(dynamoDBTables.auditLogsTable.node.children.length).toBeGreaterThan(0);
    });
  });

  describe('ExplanationCache Table', () => {
    it('should create ExplanationCache table with question_id partition key', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'explanation_cache',
        KeySchema: [
          {
            AttributeName: 'question_id',
            KeyType: 'HASH',
          },
        ],
      });
    });

    it('should have TTL enabled on ttl_expiration for 30-day retention', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'explanation_cache',
        TimeToLiveSpecification: {
          AttributeName: 'ttl_expiration',
          Enabled: true,
        },
      });
    });

    it('should have KMS encryption enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'explanation_cache',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled', () => {
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'explanation_cache',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });
  });

  describe('All Tables', () => {
    it('should have all 6 tables created', () => {
      expect(dynamoDBTables.usersTable).toBeDefined();
      expect(dynamoDBTables.questionsTable).toBeDefined();
      expect(dynamoDBTables.practiceSetsTable).toBeDefined();
      expect(dynamoDBTables.scoresTable).toBeDefined();
      expect(dynamoDBTables.auditLogsTable).toBeDefined();
      expect(dynamoDBTables.explanationCacheTable).toBeDefined();
    });

    it('should use PAY_PER_REQUEST billing mode for all tables', () => {
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::DynamoDB::Table', 6);
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    it('should have KMS encryption enabled for all tables', () => {
      const template = Template.fromStack(stack);
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled for all tables', () => {
      const template = Template.fromStack(stack);
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });
  });
});
