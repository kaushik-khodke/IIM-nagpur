#!/bin/bash
echo "Initializing LocalStack AWS Mock Services..."

# Create S3 Bucket for media uploads
awslocal s3 mb s3://tractor-seva-media

# Configure Bucket CORS to allow local uploads/downloads
awslocal s3api put-bucket-cors --bucket tractor-seva-media --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
}'

echo "LocalStack S3 Bucket 'tractor-seva-media' successfully created with local CORS rules."
