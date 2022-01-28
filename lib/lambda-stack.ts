import {Duration, NestedStack, NestedStackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda"

export class LambdaStack extends NestedStack {
  readonly infectionRateFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // Lambda function that returns infection rate HTTP response
    this.infectionRateFunction = new lambda.Function(this, "InfectionRateLambda", {
      code: lambda.Code.fromAsset("./app/lambda/"),
      handler: "infection-rate.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 128,
      timeout: Duration.seconds(20),
    });

  }
}
