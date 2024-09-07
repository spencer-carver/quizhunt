# Quizhunt
This is designed to be an AWS Lambda that sits uses a GCP service account that has permissions to view certain Google Sheets to provide an interactive quiz for different purposes.

The `credentials.json` file (not checked in) provides details for this service account to perform actions

The `npm run export` script zips up required files to be imported into the desired lambda function from the AWS Console.
