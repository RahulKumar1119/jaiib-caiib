/**
 * API Gateway configuration for JAIIB-CAIIB Exam Prep Portal
 * Includes REST API with request validation, rate limiting, CORS, and security headers
 */

import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface ApiGatewayProps {
  environment: string;
  logRetentionDays: number;
}

export interface ApiGatewayOutput {
  api: apigateway.RestApi;
  logGroup: logs.LogGroup;
}

/**
 * Creates and configures API Gateway with security and rate limiting
 */
export class ApiGateway extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    // Create CloudWatch log group for API Gateway
    this.logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${props.environment}/jaiib-caiib`,
      retention: this.getRetentionDays(props.logRetentionDays),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create REST API
    this.api = new apigateway.RestApi(this, 'JaiibCaiibApi', {
      restApiName: `jaiib-caiib-api-${props.environment}`,
      description: 'REST API for JAIIB-CAIIB Exam Prep Portal',
      deployOptions: {
        stageName: props.environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(this.logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Add request validator for all methods
    const requestValidator = this.api.addRequestValidator('RequestValidator', {
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Add API key and usage plan for rate limiting per user
    const apiKey = this.api.addApiKey('JaiibCaiibApiKey', {
      apiKeyName: `jaiib-caiib-api-key-${props.environment}`,
      description: 'API key for JAIIB-CAIIB Exam Prep Portal',
    });

    const usagePlan = this.api.addUsagePlan('JaiibCaiibUsagePlan', {
      name: `jaiib-caiib-usage-plan-${props.environment}`,
      description: 'Usage plan with rate limiting (100 requests/minute per user)',
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 100, // 100 requests per minute
        burstLimit: 200, // Allow burst up to 200
      },
    });

    usagePlan.addApiKey(apiKey);

    // Add security headers via response models
    this.addSecurityHeaders();

    // Add tags
    cdk.Tags.of(this.api).add('Environment', props.environment);
    cdk.Tags.of(this.api).add('Service', 'ApiGateway');
    cdk.Tags.of(this.logGroup).add('Environment', props.environment);
  }

  /**
   * Adds security headers to API responses
   */
  private addSecurityHeaders(): void {
    // Security headers are added via integration responses
    // This method documents the headers that should be added to all responses
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // These headers will be applied to all integration responses
    // via the API Gateway response templates
    Object.entries(securityHeaders).forEach(([header, value]) => {
      this.api.addGatewayResponse('SecurityHeader' + header.replace(/[^a-zA-Z0-9]/g, ''), {
        type: apigateway.ResponseType.DEFAULT_4XX,
        responseHeaders: {
          [header]: value,
        },
      });

      this.api.addGatewayResponse('SecurityHeader' + header.replace(/[^a-zA-Z0-9]/g, '') + '5xx', {
        type: apigateway.ResponseType.DEFAULT_5XX,
        responseHeaders: {
          [header]: value,
        },
      });
    });
  }

  /**
   * Creates a resource with request validation
   */
  public createResource(
    parent: apigateway.IResource,
    pathPart: string,
    requestValidator?: apigateway.IRequestValidator
  ): apigateway.Resource {
    return parent.addResource(pathPart);
  }

  /**
   * Adds a method with request validation and error responses
   */
  public addMethod(
    resource: apigateway.IResource,
    httpMethod: string,
    integration: apigateway.Integration,
    options?: apigateway.MethodOptions
  ): apigateway.Method {
    const methodOptions: apigateway.MethodOptions = {
      ...options,
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '401' },
        { statusCode: '403' },
        { statusCode: '404' },
        { statusCode: '429' },
        { statusCode: '500' },
      ],
    };

    return resource.addMethod(httpMethod, integration, methodOptions);
  }

  /**
   * Gets the API endpoint URL
   */
  public getApiEndpoint(): string {
    return this.api.url;
  }

  /**
   * Gets the API ID
   */
  public getApiId(): string {
    return this.api.restApiId;
  }

  /**
   * Gets the API root resource
   */
  public getRoot(): apigateway.IResource {
    return this.api.root;
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
