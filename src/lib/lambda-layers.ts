/**
 * Lambda Layer definitions for JAIIB-CAIIB Exam Prep Portal
 * Defines common dependencies and utility functions layers
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Construct } from 'constructs';

export interface LambdaLayersProps {
  environment: string;
}

export interface LambdaLayersOutput {
  commonDependenciesLayer: lambda.LayerVersion;
  utilityFunctionsLayer: lambda.LayerVersion;
}

/**
 * Creates Lambda layers for shared dependencies and utilities
 */
export class LambdaLayers extends Construct {
  public readonly commonDependenciesLayer: lambda.LayerVersion;
  public readonly utilityFunctionsLayer: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props: LambdaLayersProps) {
    super(scope, id);

    // Common dependencies layer
    // Includes: bcrypt, jsonwebtoken, aws-sdk, axios, uuid, dotenv
    this.commonDependenciesLayer = new lambda.LayerVersion(this, 'CommonDependenciesLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../infrastructure/lambda-layers/common-dependencies')
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      compatibleArchitectures: [lambda.Architecture.X86_64],
      description: 'Common dependencies layer (bcrypt, jwt, aws-sdk, axios, uuid, dotenv)',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Utility functions layer
    // Includes: encryption, validation, error-handling, logging, constants, types
    this.utilityFunctionsLayer = new lambda.LayerVersion(this, 'UtilityFunctionsLayer', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../infrastructure/lambda-layers/utility-functions/dist')
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      compatibleArchitectures: [lambda.Architecture.X86_64],
      description: 'Shared utility functions layer (encryption, validation, error-handling, logging)',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add tags
    cdk.Tags.of(this.commonDependenciesLayer).add('Layer', 'CommonDependencies');
    cdk.Tags.of(this.commonDependenciesLayer).add('Environment', props.environment);

    cdk.Tags.of(this.utilityFunctionsLayer).add('Layer', 'UtilityFunctions');
    cdk.Tags.of(this.utilityFunctionsLayer).add('Environment', props.environment);
  }

  /**
   * Gets the layers as an array for use in Lambda functions
   */
  getLayers(): lambda.ILayerVersion[] {
    return [this.commonDependenciesLayer, this.utilityFunctionsLayer];
  }

  /**
   * Gets the layer ARNs
   */
  getLayerArns(): { commonDependencies: string; utilityFunctions: string } {
    return {
      commonDependencies: this.commonDependenciesLayer.layerVersionArn,
      utilityFunctions: this.utilityFunctionsLayer.layerVersionArn,
    };
  }
}
