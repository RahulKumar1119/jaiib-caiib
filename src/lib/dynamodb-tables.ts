import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface DynamoDBTablesProps {
  kmsKey: kms.Key;
}

export class DynamoDBTables extends Construct {
  public readonly usersTable: dynamodb.Table;
  public readonly questionsTable: dynamodb.Table;
  public readonly practiceSetsTable: dynamodb.Table;
  public readonly scoresTable: dynamodb.Table;
  public readonly auditLogsTable: dynamodb.Table;
  public readonly explanationCacheTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBTablesProps) {
    super(scope, id);

    // Users Table
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'users',
      partitionKey: {
        name: 'tenant_id#user_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'session_expires_at',
    });

    // Add GSIs to Users table
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'tenant_id-created_at-index',
      partitionKey: {
        name: 'tenant_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    // Questions Table
    this.questionsTable = new dynamodb.Table(this, 'QuestionsTable', {
      tableName: 'questions',
      partitionKey: {
        name: 'paper#question_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'version',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSIs to Questions table
    this.questionsTable.addGlobalSecondaryIndex({
      indexName: 'paper-status-index',
      partitionKey: {
        name: 'paper',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.questionsTable.addGlobalSecondaryIndex({
      indexName: 'difficulty_level-paper-index',
      partitionKey: {
        name: 'difficulty_level',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'paper',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // PracticeSets Table
    this.practiceSetsTable = new dynamodb.Table(this, 'PracticeSetsTable', {
      tableName: 'practice_sets',
      partitionKey: {
        name: 'tenant_id#user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'session_expires_at',
    });

    // Add GSIs to PracticeSets table
    this.practiceSetsTable.addGlobalSecondaryIndex({
      indexName: 'practice_set_id-index',
      partitionKey: {
        name: 'practice_set_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.practiceSetsTable.addGlobalSecondaryIndex({
      indexName: 'tenant_id-created_at-index',
      partitionKey: {
        name: 'tenant_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Scores Table
    this.scoresTable = new dynamodb.Table(this, 'ScoresTable', {
      tableName: 'scores',
      partitionKey: {
        name: 'tenant_id#user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSIs to Scores table
    this.scoresTable.addGlobalSecondaryIndex({
      indexName: 'score_id-index',
      partitionKey: {
        name: 'score_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.scoresTable.addGlobalSecondaryIndex({
      indexName: 'paper-created_at-index',
      partitionKey: {
        name: 'paper',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // AuditLogs Table
    this.auditLogsTable = new dynamodb.Table(this, 'AuditLogsTable', {
      tableName: 'audit_logs',
      partitionKey: {
        name: 'tenant_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl_expiration',
    });

    // Add GSIs to AuditLogs table
    this.auditLogsTable.addGlobalSecondaryIndex({
      indexName: 'audit_id-index',
      partitionKey: {
        name: 'audit_id',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.auditLogsTable.addGlobalSecondaryIndex({
      indexName: 'user_id-created_at-index',
      partitionKey: {
        name: 'user_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.auditLogsTable.addGlobalSecondaryIndex({
      indexName: 'event_type-created_at-index',
      partitionKey: {
        name: 'event_type',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created_at',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ExplanationCache Table
    this.explanationCacheTable = new dynamodb.Table(
      this,
      'ExplanationCacheTable',
      {
        tableName: 'explanation_cache',
        partitionKey: {
          name: 'question_id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: props.kmsKey,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        timeToLiveAttribute: 'ttl_expiration',
      }
    );
  }
}
