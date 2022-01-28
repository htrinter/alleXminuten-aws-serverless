import {NestedStack, NestedStackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from "aws-cdk-lib/aws-iam"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"

type Props = {
  frontendBucket: s3.Bucket;
  infectionRateFunction: lambda.Function;
} & NestedStackProps;

export class HostingStack extends NestedStack {

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    // API Gateway delivers frontend and provides a Lambda-backed API
    const hostingApi = new apigw.RestApi(this, "HostingApi", {
      restApiName: "AlleXMinutenHostingApi"
    });
    const defaultResponseParameters = {
      "method.response.header.Content-Type": true,
      "method.response.header.Access-Control-Allow-Origin": true
    };

    // S3 service integration for delivery of frontend files
    const frontendBucketAccessRole = new iam.Role(this, "FrontendBucketAccess", {
      description: "Allows API Gateway to access frontend files in S3 bucket",
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      inlinePolicies: {
        "s3-access": new iam.Policy(this, "FrontendBucketAccessPolicy", {
          statements: [
            iam.PolicyStatement.fromJson({
              Effect: "Allow",
              Action: ["s3:ListBucket", "s3:GetObject"],
              Resource: [
                props.frontendBucket.bucketArn,
                `${props.frontendBucket.bucketArn}/*`,
              ],
            }),
          ],
        }).document,
      },
    });
    const s3IndexIntegration = new apigw.AwsIntegration(
      {
        service: "s3",
        integrationHttpMethod: "GET",
        path: props.frontendBucket.bucketName + "/index.html",
        options: {
          credentialsRole: frontendBucketAccessRole,
          integrationResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Content-Type": "integration.response.header.Content-Type",
              },
            },
          ] as apigw.IntegrationResponse[],
        },
      }
    );
    hostingApi.root.addMethod("GET", s3IndexIntegration, {
      methodResponses: [{
        statusCode: "200",
        responseParameters: defaultResponseParameters
      }],
    });

    // Lambda service integration for API
    const infectionRateLambdaIntegration = new apigw.LambdaIntegration(props.infectionRateFunction);
    const apiRes = hostingApi.root.addResource("api")
    const infectionRateRes = apiRes.addResource("infectionRate")
    infectionRateRes.addMethod("GET", infectionRateLambdaIntegration, {
      methodResponses: [{
        statusCode: "200",
        responseParameters: defaultResponseParameters
      }]
    })
  }
}
