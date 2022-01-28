import {NestedStack, NestedStackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3_deployment from "aws-cdk-lib/aws-s3-deployment";

export class FrontendStack extends NestedStack {
  readonly frontendBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // S3 bucket holds static frontend files
    this.frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // Frontend files are being deployed into the bucket
    new s3_deployment.BucketDeployment(this, "FrontendDeployment", {
      sources: [s3_deployment.Source.asset("./frontend/")],
      destinationBucket: this.frontendBucket
    });

  }
}
