import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {LambdaStack} from "./lambda-stack";
import {FrontendStack} from "./frontend-stack";
import {HostingStack} from "./hosting-stack";

export class AlleXMinutenStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaStack = new LambdaStack(this, "LambdaStack", {});
    const frontendStack = new FrontendStack(this, "FrontendStack", {});
    new HostingStack(this, "HostingStack", {
      infectionRateFunction: lambdaStack.infectionRateFunction,
      frontendBucket: frontendStack.frontendBucket,
    });
  }
}
