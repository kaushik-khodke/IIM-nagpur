const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('====================================================');
console.log('       AWS CLOUD ENVIRONMENT INSPECTION TOOL        ');
console.log('====================================================\n');

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'tractor-seva-harvester';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

console.log('Checking Environment Configuration:');
console.log(`- AWS Region:          ${region}`);
console.log(`- AWS S3 Bucket Name:   ${bucketName}`);
console.log(`- AWS Access Key ID:    ${accessKeyId ? accessKeyId.slice(0, 5) + '...' + accessKeyId.slice(-4) : 'NOT SET'}`);
console.log(`- AWS Secret Key:       ${secretAccessKey ? 'PRESENT (Hidden for security)' : 'NOT SET'}\n`);

if (!accessKeyId || accessKeyId === 'YOUR_AWS_ACCESS_KEY_ID' || !secretAccessKey || secretAccessKey === 'YOUR_AWS_SECRET_ACCESS_KEY') {
  console.error('❌ ERROR: Please paste your real AWS Access Key ID and Secret Access Key into backend/.env first!');
  process.exit(1);
}

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');

async function testAWSCloud() {
  console.log('----------------------------------------------------');
  console.log('1. Testing S3 Bucket Access...');
  console.log('----------------------------------------------------');
  
  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });

  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 5 });
    const response = await s3Client.send(command);
    console.log(`✅ S3 SUCCESS! Connected to bucket "${bucketName}" on AWS Region "${region}".`);
    console.log(`   Found ${response.KeyCount || 0} objects in bucket.`);
    if (response.Contents && response.Contents.length > 0) {
      console.log('   Sample files in S3 bucket:');
      response.Contents.forEach(item => {
        console.log(`   - ${item.Key} (${item.Size} bytes)`);
      });
    }
  } catch (s3Err) {
    console.error(`❌ S3 ERROR: ${s3Err.message}`);
  }

  console.log('\n----------------------------------------------------');
  console.log('2. Checking for AWS DynamoDB (NoSQL Tables)...');
  console.log('----------------------------------------------------');
  try {
    const ddbClient = new DynamoDBClient({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });
    const ddbResponse = await ddbClient.send(new ListTablesCommand({}));
    if (ddbResponse.TableNames && ddbResponse.TableNames.length > 0) {
      console.log(`✅ DISCOVERED ${ddbResponse.TableNames.length} DynamoDB NoSQL Table(s) in region "${region}":`);
      ddbResponse.TableNames.forEach(tableName => {
        console.log(`   - Table Name:  ${tableName}`);
      });
    } else {
      console.log(`ℹ️ No DynamoDB NoSQL tables found in region "${region}".`);
    }
  } catch (ddbErr) {
    if (ddbErr.name === 'AccessDenied' || ddbErr.name === 'AccessDeniedException') {
      console.log(`⚠️ IAM User does not have permission for DynamoDB (ListTables). Error: ${ddbErr.message}`);
    } else {
      console.log(`⚠️ Could not query DynamoDB: ${ddbErr.message}`);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log('3. Checking for AWS RDS MySQL (SQL Databases)...');
  console.log('----------------------------------------------------');
  try {
    const rdsClient = new RDSClient({
      region,
      credentials: { accessKeyId, secretAccessKey }
    });
    const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
    if (rdsResponse.DBInstances && rdsResponse.DBInstances.length > 0) {
      console.log(`✅ DISCOVERED ${rdsResponse.DBInstances.length} RDS Database(s) in region "${region}":`);
      rdsResponse.DBInstances.forEach(db => {
        console.log(`   - DB Identifier:  ${db.DBInstanceIdentifier}`);
        console.log(`   - Engine:         ${db.Engine} (${db.EngineVersion})`);
        console.log(`   - Host Endpoint:   ${db.Endpoint ? db.Endpoint.Address : 'N/A'}`);
      });
    } else {
      console.log(`ℹ️ No RDS SQL Database instances found in region "${region}".`);
    }
  } catch (rdsErr) {
    if (rdsErr.name === 'AccessDenied' || rdsErr.name === 'AccessDeniedException') {
      console.log(`⚠️ IAM User does not have permission for RDS (DescribeDBInstances). Error: ${rdsErr.message}`);
    } else {
      console.log(`⚠️ Could not query RDS: ${rdsErr.message}`);
    }
  }
}

testAWSCloud();
