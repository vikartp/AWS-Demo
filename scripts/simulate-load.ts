/**
 * DocuMind Observability Load Simulator
 * Generates realistic synthetic traffic against BFF, Backend, and Worker
 * to demonstrate Prometheus metrics, percentiles, error rates, and Grafana dashboards.
 */

import axios from 'axios';
import FormData from 'form-data';

const BFF_URL = 'http://localhost:3000';

interface UserSession {
  email: string;
  name: string;
  token: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        DocuMind Observability Traffic Simulator             ║
║                                                              ║
║  Target: ${BFF_URL}                                     ║
║  Grafana: http://localhost:3002 (Dashboards)                 ║
║  Prometheus: http://localhost:9090 (Alerts & Metrics)        ║
╚══════════════════════════════════════════════════════════════╝
  `);

  const users = [
    { email: 'architect@documind.io', name: 'Solutions Architect', password: 'SecurePassword123!' },
    { email: 'devops@documind.io', name: 'DevOps Lead', password: 'SecurePassword123!' },
    { email: 'security@documind.io', name: 'Security Auditor', password: 'SecurePassword123!' },
  ];

  const sessions: UserSession[] = [];

  // Step 1: User Onboarding & Logins
  console.log('⚡ [1/5] Authenticating simulated users...');
  for (const u of users) {
    try {
      // Try login or register
      let token = '';
      try {
        const loginRes = await axios.post(`${BFF_URL}/api/auth/login`, {
          email: u.email,
          password: u.password,
        });
        token = loginRes.data.data.token;
      } catch {
        const regRes = await axios.post(`${BFF_URL}/api/auth/register`, {
          email: u.email,
          displayName: u.name,
          password: u.password,
        });
        token = regRes.data.data.token;
      }
      sessions.push({ email: u.email, name: u.name, token });
      console.log(`  ✓ Authenticated user: ${u.email}`);
    } catch (err: any) {
      console.error(`  ✗ Failed to authenticate ${u.email}:`, err.message);
    }
  }

  // Step 2: Ingest Sample Documents
  console.log('\n⚡ [2/5] Simulating concurrent document uploads...');
  const sampleDocs = [
    {
      title: 'Amazon Bedrock Foundation Models Overview',
      category: 'Technical',
      tags: ['aws', 'bedrock', 'genai'],
      content: '# Amazon Bedrock\nAmazon Bedrock is a fully managed service that offers a choice of high-performing foundation models (FMs) from leading AI companies like AI21 Labs, Anthropic, Cohere, Meta, Stability AI, and Amazon with a single API.\n\n## Serverless Architecture\nBecause Amazon Bedrock is serverless, you do not have to manage any infrastructure, and you can securely integrate and deploy generative AI capabilities into your applications using the AWS services you are already familiar with.',
    },
    {
      title: 'AWS Cloud Security & IAM Least Privilege Guide',
      category: 'Legal',
      tags: ['security', 'iam', 'compliance'],
      content: '# AWS Identity and Access Management\nAWS Identity and Access Management (IAM) is a web service that helps you securely control access to AWS resources. When you use IAM, you can create and manage AWS users and groups, and use permissions to allow and deny their access to AWS resources.\n\n## Best Practices\nApply least privilege permissions. Grant only the permissions required to perform a task. Use IAM roles for EC2 instances and Lambda functions rather than long-term credentials.',
    },
    {
      title: 'Q3 Enterprise Architecture Budget & Cloud Cost Analysis',
      category: 'Finance',
      tags: ['budget', 'finops', 'aws-cost'],
      content: '# Cloud Financial Management\nReviewing our Q3 AWS expenditures across compute, database, and generative AI services. Serverless migrations for BFF and background workers have yielded a 38% reduction in monthly idle costs compared to always-on container clusters.\n\n## Action Items\nImplement AWS Budgets alerts, enforce tag allocation, and evaluate Graviton processor instances for remaining containerized workloads.',
    },
    {
      title: 'Microservices vs Serverless BFF Architectural Review',
      category: 'Research',
      tags: ['architecture', 'serverless', 'bff'],
      content: '# Backend-for-Frontend Architecture\nWhen building client-intensive web applications with React or mobile clients, the BFF pattern simplifies front-end code by aggregating backend services. Implementing BFF on AWS Lambda eliminates server maintenance and automatically scales with web traffic surges.',
    },
  ];

  const uploadedDocIds: string[] = [];

  for (let i = 0; i < sampleDocs.length; i++) {
    const doc = sampleDocs[i];
    const session = sessions[i % sessions.length];
    try {
      const form = new FormData();
      form.append('file', Buffer.from(doc.content, 'utf-8'), {
        filename: `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`,
        contentType: 'text/markdown',
      });
      form.append('title', doc.title);
      form.append('category', doc.category);
      form.append('tags', doc.tags.join(','));

      const res = await axios.post(`${BFF_URL}/api/documents/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${session.token}`,
        },
      });

      uploadedDocIds.push(res.data.data.id);
      console.log(`  ✓ Ingested document: "${doc.title}" (ID: ${res.data.data.id})`);
    } catch (err: any) {
      console.error(`  ✗ Upload failed for "${doc.title}":`, err.response?.data || err.message);
    }
  }

  // Step 3: Rapid Search and Query Operations (Simulate 30 queries)
  console.log('\n⚡ [3/5] Generating search & query traffic (30 operations)...');
  const searchQueries = ['aws', 'security', 'architecture', 'finops', 'bedrock', 'serverless', 'budget'];
  const categories = ['Technical', 'Finance', 'Legal', 'Research', ''];

  for (let i = 0; i < 30; i++) {
    const session = sessions[i % sessions.length];
    const q = searchQueries[i % searchQueries.length];
    const cat = categories[i % categories.length];

    try {
      await axios.get(`${BFF_URL}/api/documents`, {
        params: { search: q, category: cat },
        headers: { Authorization: `Bearer ${session.token}` },
      });
      process.stdout.write('.');
    } catch (err: any) {
      process.stdout.write('x');
    }
    await sleep(50);
  }
  console.log(' Done.');

  // Step 4: Intentional Error Generation (to verify Prometheus error counters & alert triggers)
  console.log('\n⚡ [4/5] Simulating intentional error scenarios (400, 401, 404)...');
  const validToken = sessions[0]?.token || '';

  // 400 Bad Request
  try {
    await axios.post(`${BFF_URL}/api/auth/login`, { email: 'bad-request-no-password' });
  } catch {
    console.log('  ✓ Triggered 400 Bad Request');
  }

  // 401 Unauthorized
  try {
    await axios.get(`${BFF_URL}/api/documents`, {
      headers: { Authorization: 'Bearer invalid-expired-fake-token' },
    });
  } catch {
    console.log('  ✓ Triggered 401 Unauthorized');
  }

  // 404 Not Found
  try {
    await axios.get(`${BFF_URL}/api/documents/non-existent-doc-id-12345`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
  } catch {
    console.log('  ✓ Triggered 404 Not Found');
  }

  // Step 5: AI Questions & Token Consumption
  console.log('\n⚡ [5/5] Invoking AI question answering & token consumption...');
  const targetDocId = uploadedDocIds[0] || 'doc-1';

  for (let i = 0; i < 5; i++) {
    try {
      const aiRes = await axios.post(
        `${BFF_URL}/api/ai/ask`,
        {
          documentId: targetDocId,
          question: `What are the key serverless architectural best practices mentioned in question #${i + 1}?`,
        },
        {
          headers: { Authorization: `Bearer ${validToken}` },
        },
      );
      console.log(`  ✓ AI Response received (${aiRes.data.data?.tokensUsed?.output || 50} tokens generated)`);
    } catch (err: any) {
      console.log(`  ! AI endpoint response: ${err.response?.status || err.message}`);
    }
    await sleep(200);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        Simulation Complete! Metrics Successfully Populated   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Open Grafana to see real-time charts:                       ║
║  👉 http://localhost:3002/dashboards                         ║
║                                                              ║
║  Dashboards to inspect:                                      ║
║  1. DocuMind - Application Overview                          ║
║  2. DocuMind - API Performance & Latency                     ║
║  3. DocuMind - Amazon Bedrock & AI Usage                     ║
║  4. DocuMind - Async Worker & Queue Processing               ║
║                                                              ║
║  Prometheus Scrapes & Alerts:                                ║
║  👉 http://localhost:9090/alerts                             ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

main().catch(console.error);
