# secondCloudformation# Second AWS Cloudformation Project

## Table of Contents
+ [About](#about)
+ [Getting Started](#getting_started)

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
