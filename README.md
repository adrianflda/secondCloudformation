Second AWS Cloudformation Project

## Table of Contents
+ [About](#about)
+ [Getting Started](#getting_started)
+ [Usage](#usage)

## About <a name = "about"></a>

This project shows the use of AWS Cloudformation in a simple way using basic concepts and less simple tools. We will see roles and privilege just as we need to do, we will also use nested-stacks, parameters, and outputs, intrinsic functions, and what everyone expects s3 bucket and lambdas functions.


## Getting Started "The task" <a name = "getting_started"></a>

Do an s3 encrypted bucket, when put in “csv/” folder some files .csv and this action triggers a notification to some lambda function who read each new file and convert each row in 1 .json file and it going to put them in “json/" folder; each new ".json" file in "json/" folder, trigger a notification to other lambda function and determines if the age of the person is over 18-year-olds it going to put the file in a folder named “dictionary/”.

Them we needs:
+ one encrypted server side s3 bucket with two notifications:
+ first lambda fuction for process put csv files in csv/ folder.
+ second lambda function for process put json file in json/folder.


### Prerequisites

We need to know what privilegies we have:

```
+ aws iam list-groups-for-user --user-name
+ aws iam list-attached-group-policies --group-name
+ aws iam list-group-policies --group-name
+ aws iam list-attached-user-policies --user-name
+ aws iam list-user-policies --user-name

```
In my case i have "iam:createRole" "iam:createPolicie" and "iam:attachPolicies"  privileges, all i need for this task. 


### Installing

A step by step series of examples that tell you how to get a development env running.

First we must create main role for aws cli usage:

```
aws iam create-role --role-name main --assume-role-policy-document file://User-trust-role.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "mainTrustRole",
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Principal": {"AWS": "arn:aws:iam::account-id:user/main-user-name"}
        }
    ]
}
```

we need some other policies:

```
aws iam put-role-policy --role-name main --policy-name main-s3-policy --policy-document file://main-iam-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "IAMROLE",
            "Effect": "Allow",
            "Action": [
                "iam:CreatePolicy",
                "iam:GetRole",
                "iam:GetPolicyVersion",
                "iam:PassRole",
                "iam:GetPolicy",
                "iam:CreateRole",
                "iam:UpdateRole",
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy",
                "iam:GetRolePolicy"
            ],
            "Resource": [
                "arn:aws:iam::343413928436:role/*",
                "arn:aws:iam::343413928436:policy/*"
            ]
        }
    ]
}
```

```
aws iam put-role-policy --role-name main --policy-name main-s3-policy --policy-document file://main-s3-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MainRoleS3PolicyGeneral",
            "Effect": "Allow",
            "Action": [
                "s3:PutAccountPublicAccessBlock",
                "s3:GetAccountPublicAccessBlock",
                "s3:ListAllMyBuckets",
                "s3:ListJobs",
                "s3:CreateJob",
                "s3:HeadBucket"
            ],
            "Resource": "*"
        },
        {
            "Sid": "MainRoleS3PolicyAll",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::*/*"
        },
        {
            "Sid": "MainRoleS3PolicyJob",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::*",
                "arn:aws:s3:us-east-2:343413928436:job/*"
            ]
        }
    ]
}
```

```
aws iam put-role-policy --role-name main --policy-name main-cf-policy --policy-document file://main-cf-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CloudformationMainRoleList",
            "Effect": "Allow",
            "Action": [
                "cloudformation:ListStackSetOperationResults",
                "cloudformation:ListStackSets",
                "cloudformation:ListStackSetOperations",
                "cloudformation:ListStackInstances",
                "cloudformation:ListChangeSets",
                "cloudformation:DescribeStacks",
                "cloudformation:ListStackResources"
            ],
            "Resource": [
                "arn:aws:cloudformation:us-east-2:343413928436:stackset/*:*",
                "arn:aws:cloudformation:us-east-2:343413928436:stack/*/*"
            ]
        },
        {
            "Sid": "CloudformationMainRoleListAll",
            "Effect": "Allow",
            "Action": [
                "cloudformation:ListExports",
                "cloudformation:ListStacks",
                "cloudformation:ListImports"
            ],
            "Resource": "*"
        },
        {
            "Sid": "CloudformationMainRoleAll",
            "Effect": "Allow",
            "Action": "cloudformation:*",
            "Resource": [
                "arn:aws:cloudformation:us-east-2:343413928436:stackset/*:*",
                "arn:aws:cloudformation:us-east-2:343413928436:stack/*/*"
            ]
        }
    ]
}
```

```
aws iam put-role-policy --role-name main --policy-name main-lambda-policy --policy-document file://main-lambda-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MainRoleLambdaGeneral",
            "Effect": "Allow",
            "Action": [
                "lambda:ListFunctions",
                "lambda:ListEventSourceMappings",
                "lambda:ListLayerVersions",
                "lambda:ListLayers",
                "lambda:GetAccountSettings",
                "lambda:CreateEventSourceMapping"
            ],
            "Resource": "*"
        },
        {
            "Sid": "MainRoleLambdaLayer",
            "Effect": "Allow",
            "Action": "lambda:*",
            "Resource": "arn:aws:lambda:us-east-2:343413928436:layer:*"
        },
        {
            "Sid": "MainRoleLambdaFunction",
            "Effect": "Allow",
            "Action": "lambda:*",
            "Resource": [
                "arn:aws:lambda:us-east-2:343413928436:function:*",
                "arn:aws:lambda:us-east-2:343413928436:event-source-mapping:*",
                "arn:aws:lambda:us-east-2:343413928436:layer:*:*"
            ]
        }
    ]
}
```

You can configure the AWS Command Line Interface (AWS CLI) to use an IAM role by defining a profile for the role https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

```
nano ~/.aws/config file.
[profile main]
region = us-east-2
output = text
role_arn = arn:aws:iam::account-id:role/main
source_profile = default
```

```
nano ~/.aws/credentials:
[default]
aws_access_key_id = your-key-id
aws_secret_access_key = your-acces-key
```

## Usage <a name = "usage"></a>

First: create bucket for upload all our templates and use from there

Why?: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-whatis-howdoesitwork.html

If you specify a template file stored locally, AWS CloudFormation uploads it to an S3 bucket in your AWS account. AWS CloudFormation creates a bucket for each region in which you upload a template file. The buckets are accessible to anyone with Amazon Simple Storage Service (Amazon S3) permissions in your AWS account. If a bucket created by AWS CloudFormation is already present, the template is added to that bucket.
You can use your own bucket and manage its permissions by manually uploading templates to Amazon S3. Then whenever you create or update a stack, specify the Amazon S3 URL of a template file.

Create s3 bucket "cf-storage":

```
aws s3 mb cf-storage: 
```


Create role for acces to the bucket:

```
aws s3api put-bucket-policy --bucket cf-storage --policy file://s3BucketPolicy.json
{
    "Version":"2012-10-17",
    "Statement": [
        {
            "Effect":"Allow",
	        "Principal": {
                "AWS": "arn:aws:iam::343413928436:user/adrian.flda@gmail.com"
            },
	        "Action":["s3:*"],
            "Resource": ["arn:aws:s3:::cf-storage/*"]
        },
        {
            "Effect":"Allow",
	        "Principal": {
                "Service": "cloudformation.amazonaws.com"
            },
	        "Action":["s3:*"],
            "Resource": ["arn:aws:s3:::cf-storage/*"]
        }
    ]
}
```


Create cf templates for do the task, and upload avery one to s3 bucket cf-storage:

```
aws s3 cp  s3Bucket.yml s3://cf-storage/
```

```
aws s3 cp  lambda-function.yml s3://cf-storage/
```

```
aws s3 cp  lambda-layer-csv.yml s3://cf-storage/
```

```
aws s3 cp  lambda-permission-s3.yml s3://cf-storage/
```

```
aws s3 cp  lambda-role.yml s3://cf-storage/
```

```
aws s3 cp mainStack.yml s3://cf-storage/
```


Create and upload lambda function deploy packege and layer packege

```
cd lambda/csvtojson/
zip csvtojson_function.zip index.js
aws s3 cp  csvtojson_function.zip s3://cf-storage/
aws s3 cp  csvtojson-layer.zip  s3://cf-storage/
```

```
cd lambda/jsontodictionary
zip jsontodictionary_function.zip index.js
aws s3 cp  jsontodictionary_function.zip s3://cf-storage/
```
