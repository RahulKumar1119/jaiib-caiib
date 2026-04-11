/**
 * Frontend hosting configuration for JAIIB-CAIIB Exam Prep Portal
 * Uses S3 for static site hosting and CloudFront for CDN
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface FrontendHostingProps {
  environment: string;
}

/**
 * Creates S3 bucket and CloudFront distribution for frontend hosting
 */
export class FrontendHosting extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly bucketName: string;
  public readonly distributionDomainName: string;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: FrontendHostingProps) {
    super(scope, id);

    // Create S3 bucket for frontend
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `jaiib-caiib-frontend-${props.environment}-${cdk.Stack.of(this).account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    this.bucketName = this.bucket.bucketName;

    // Create Origin Access Identity for CloudFront
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for JAIIB-CAIIB frontend ${props.environment}`,
    });

    // Grant CloudFront read access to S3 bucket
    this.bucket.grantRead(oai);

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      additionalBehaviors: {
        // Cache HTML files with shorter TTL for updates
        '*.html': {
          origin: new origins.S3Origin(this.bucket, {
            originAccessIdentity: oai,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, 'HtmlCachePolicy', {
            cachePolicyName: `jaiib-html-cache-${props.environment}`,
            comment: 'Cache policy for HTML files',
            defaultTtl: cdk.Duration.hours(1),
            maxTtl: cdk.Duration.hours(24),
            minTtl: cdk.Duration.seconds(0),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
          compress: true,
        },
        // Cache API calls with custom headers
        '/api/*': {
          origin: new origins.S3Origin(this.bucket, {
            originAccessIdentity: oai,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          compress: true,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    this.distributionDomainName = this.distribution.domainName;
    this.distributionId = this.distribution.distributionId;

    // Add tags
    cdk.Tags.of(this.bucket).add('Environment', props.environment);
    cdk.Tags.of(this.bucket).add('Service', 'Frontend');
    cdk.Tags.of(this.distribution).add('Environment', props.environment);
    cdk.Tags.of(this.distribution).add('Service', 'Frontend');
  }

  /**
   * Gets the CloudFront distribution URL
   */
  public getDistributionUrl(): string {
    return `https://${this.distributionDomainName}`;
  }

  /**
   * Gets the S3 bucket name
   */
  public getBucketName(): string {
    return this.bucketName;
  }
}
