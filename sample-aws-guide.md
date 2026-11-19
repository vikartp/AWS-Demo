# AWS Serverless Architectural Patterns

AWS Lambda is an event-driven serverless compute service that automatically scales from a few requests per day to hundreds of thousands of requests per second. When architecting modern serverless applications on AWS, developers often combine Amazon API Gateway, AWS Lambda, Amazon DynamoDB, and Amazon S3.

## The Backend-for-Frontend (BFF) Pattern
The Backend-for-Frontend pattern provides dedicated API gateways or orchestration services tailored for individual client platforms such as web applications, mobile apps, or third-party integrations. The BFF validates identity tokens (such as Amazon Cognito JWTs), aggregates multiple fine-grained backend microservice calls into unified payloads, and isolates client devices from backend evolution.

## Generative AI Integration with Amazon Bedrock
Amazon Bedrock enables serverless generative AI workflows without managing GPU clusters. By leveraging foundation models such as Anthropic Claude 3 Haiku and Amazon Titan Embeddings, applications can implement Retrieval-Augmented Generation (RAG) by converting documents into vector embeddings and storing them in vector databases like MongoDB Atlas Vector Search or Amazon OpenSearch Serverless.
