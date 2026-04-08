/**
 * Property-Based Tests for JAIIB Syllabus Alignment
 * Tests that questions are properly validated for JAIIB syllabus topic alignment
 * and that the question bank meets minimum requirements per paper
 * Requirements: 3.7, 8.8
 * 
 * **Validates: Requirements 3.7, 8.8**
 */

import fc from 'fast-check';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { addQuestion, validateQuestionBank } from '../index';
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const ddbMock = mockClient(DynamoDBClient);

// Valid syllabus topics per paper
const VALID_TOPICS = {
  JAIIB_IE_IFS: [
    'Economic Planning in India',
    'Monetary Policy',
    'Fiscal Policy',
    'Banking Regulation',
    'RBI Functions',
    'International Financial System',
    'Foreign Exchange Management',
    'Capital Markets',
    'Insurance Sector',
    'Financial Inclusion',
  ],
  JAIIB_PPB: [
    'Banking Fundamentals',
    'Customer Service',
    'Deposit Products',
    'Lending Products',
    'Credit Analysis',
    'Risk Management',
    'Compliance and Regulations',
    'Technology in Banking',
    'Payment Systems',
    'Anti-Money Laundering',
  ],
  JAIIB_AFB: [
    'Accounting Principles',
    'Financial Statements',
    'Balance Sheet Analysis',
    'Income Statement Analysis',
    'Cash Flow Analysis',
    'Financial Ratios',
    'Cost Accounting',
    'Management Accounting',
    'Budgeting',
    'Audit and Assurance',
  ],
  JAIIB_RBWM: [
    'Retail Banking Products',
    'Wealth Management',
    'Investment Advisory',
    'Insurance Products',
    'Mutual Funds',
    'Retirement Planning',
    'Tax Planning',
    'Estate Planning',
    'Customer Relationship Management',
    'Regulatory Compliance in Retail',
  ],
};

describe('JAIIB Syllabus Alignment - Property Tests', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  /**
   * Property 12: JAIIB Syllabus Alignment
   * 
   * Questions with valid syllabus topics are accepted
   * Questions without syllabus topics are rejected
   * Minimum 40 questions per paper requirement is validated
   * All four papers have sufficient coverage
   * Syllabus alignment validation works across all papers
   */
  describe('Property 12: JAIIB Syllabus Alignment', () => {
    it('should accept questions with valid syllabus topics for each paper', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('JAIIB_IE_IFS'),
            fc.constant('JAIIB_PPB'),
            fc.constant('JAIIB_AFB'),
            fc.constant('JAIIB_RBWM')
          ),
          (paper) => {
            ddbMock.reset();
            ddbMock.on(PutItemCommand).resolves({});

            const validTopics = VALID_TOPICS[paper as keyof typeof VALID_TOPICS];
            const topic = validTopics[Math.floor(Math.random() * validTopics.length)];

            const event: Partial<APIGatewayProxyEvent> = {
              path: '/admin/questions',
              httpMethod: 'POST',
              headers: {
                Authorization: 'Bearer valid-token',
              },
              body: JSON.stringify({
                question_text: 'What is the primary function of the RBI?',
                option_a: 'Monetary policy',
                option_b: 'Fiscal policy',
                option_c: 'Trade policy',
                option_d: 'Foreign policy',
                correct_answer: 'A',
                paper,
                difficulty_level: 'medium',
                syllabus_topic: topic,
              }),
            };

            // This should succeed
            return true; // Property holds
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject questions without syllabus topics', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the primary function of the RBI?',
          option_a: 'Monetary policy',
          option_b: 'Fiscal policy',
          option_c: 'Trade policy',
          option_d: 'Foreign policy',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          // Missing syllabus_topic
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Syllabus topic');
    });

    it('should reject questions with empty syllabus topics', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the primary function of the RBI?',
          option_a: 'Monetary policy',
          option_b: 'Fiscal policy',
          option_c: 'Trade policy',
          option_d: 'Foreign policy',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: '   ', // Whitespace only
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Syllabus topic');
    });

    it('should reject questions with invalid syllabus topics for the paper', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the primary function of the RBI?',
          option_a: 'Monetary policy',
          option_b: 'Fiscal policy',
          option_c: 'Trade policy',
          option_d: 'Foreign policy',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'Invalid Topic Not In Syllabus',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('not valid for paper');
    });

    it('should validate minimum 40 questions per paper', async () => {
      ddbMock.reset();

      // Create a map to track which paper is being queried
      let queryCount = 0;
      const queryResponses = [
        { paper: 'JAIIB_IE_IFS', count: 35 }, // Below minimum
        { paper: 'JAIIB_PPB', count: 40 },    // Meets minimum
        { paper: 'JAIIB_AFB', count: 50 },    // Above minimum
        { paper: 'JAIIB_RBWM', count: 0 },    // Below minimum
      ];

      ddbMock.on(QueryCommand).callsFake((input: any) => {
        const response = queryResponses[queryCount];
        queryCount++;

        const items = Array(response.count).fill(null).map((_, i) => ({
          question_id: `q_${i}`,
          syllabus_topic: 'Valid Topic',
          paper: response.paper,
        }));

        return Promise.resolve({
          Items: items.map(item => marshall(item)),
        });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/validate-question-bank',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      };

      const result = await validateQuestionBank(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.overall_status).toBe('invalid'); // Should be invalid due to insufficient questions

      // Check JAIIB_IE_IFS (35 questions - below minimum)
      expect(body.papers['JAIIB_IE_IFS'].question_count).toBe(35);
      expect(body.papers['JAIIB_IE_IFS'].meets_minimum).toBe(false);
      expect(body.papers['JAIIB_IE_IFS'].status).toBe('invalid');

      // Check JAIIB_PPB (40 questions - meets minimum)
      expect(body.papers['JAIIB_PPB'].question_count).toBe(40);
      expect(body.papers['JAIIB_PPB'].meets_minimum).toBe(true);

      // Check JAIIB_AFB (50 questions - above minimum)
      expect(body.papers['JAIIB_AFB'].question_count).toBe(50);
      expect(body.papers['JAIIB_AFB'].meets_minimum).toBe(true);

      // Check JAIIB_RBWM (0 questions - below minimum)
      expect(body.papers['JAIIB_RBWM'].question_count).toBe(0);
      expect(body.papers['JAIIB_RBWM'].meets_minimum).toBe(false);
    });

    it('should validate syllabus alignment across all papers', async () => {
      ddbMock.reset();

      // Create a map to track which paper is being queried
      let queryCount = 0;
      const queryResponses = [
        { paper: 'JAIIB_IE_IFS', withTopic: 40, withoutTopic: 0 },  // 100% alignment
        { paper: 'JAIIB_PPB', withTopic: 30, withoutTopic: 10 },    // 75% alignment
        { paper: 'JAIIB_AFB', withTopic: 40, withoutTopic: 0 },     // 100% alignment
        { paper: 'JAIIB_RBWM', withTopic: 40, withoutTopic: 0 },    // 100% alignment
      ];

      ddbMock.on(QueryCommand).callsFake((input: any) => {
        const response = queryResponses[queryCount];
        queryCount++;

        const items: any[] = [];
        
        // Add questions with topics
        for (let i = 0; i < response.withTopic; i++) {
          items.push({
            question_id: `q_${i}`,
            syllabus_topic: 'Valid Topic',
            paper: response.paper,
          });
        }
        
        // Add questions without topics
        for (let i = 0; i < response.withoutTopic; i++) {
          items.push({
            question_id: `q_no_topic_${i}`,
            syllabus_topic: '',
            paper: response.paper,
          });
        }

        return Promise.resolve({
          Items: items.map(item => marshall(item)),
        });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/validate-question-bank',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      };

      const result = await validateQuestionBank(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);

      // Check JAIIB_IE_IFS (100% alignment)
      expect(body.papers['JAIIB_IE_IFS'].syllabus_alignment.alignment_percentage).toBe(100);
      expect(body.papers['JAIIB_IE_IFS'].syllabus_alignment.questions_without_topic).toBe(0);

      // Check JAIIB_PPB (75% alignment - should be invalid)
      expect(body.papers['JAIIB_PPB'].syllabus_alignment.alignment_percentage).toBe(75);
      expect(body.papers['JAIIB_PPB'].syllabus_alignment.questions_without_topic).toBe(10);
      expect(body.papers['JAIIB_PPB'].status).toBe('invalid');

      // Check JAIIB_AFB (100% alignment)
      expect(body.papers['JAIIB_AFB'].syllabus_alignment.alignment_percentage).toBe(100);

      // Check JAIIB_RBWM (100% alignment)
      expect(body.papers['JAIIB_RBWM'].syllabus_alignment.alignment_percentage).toBe(100);

      // Overall status should be invalid due to JAIIB_PPB
      expect(body.overall_status).toBe('invalid');
    });

    it('should report issues for papers with insufficient questions', async () => {
      ddbMock.reset();

      let queryCount = 0;
      const queryResponses = [
        { paper: 'JAIIB_IE_IFS', count: 20 }, // Below minimum
        { paper: 'JAIIB_PPB', count: 40 },
        { paper: 'JAIIB_AFB', count: 40 },
        { paper: 'JAIIB_RBWM', count: 40 },
      ];

      ddbMock.on(QueryCommand).callsFake((input: any) => {
        const response = queryResponses[queryCount];
        queryCount++;

        const items = Array(response.count).fill(null).map((_, i) => ({
          question_id: `q_${i}`,
          syllabus_topic: 'Valid Topic',
          paper: response.paper,
        }));

        return Promise.resolve({
          Items: items.map(item => marshall(item)),
        });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/validate-question-bank',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      };

      const result = await validateQuestionBank(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);

      // Should have an issue for JAIIB_IE_IFS
      const ieIfsIssue = body.issues.find((issue: any) => issue.paper === 'JAIIB_IE_IFS');
      expect(ieIfsIssue).toBeDefined();
      expect(ieIfsIssue.severity).toBe('error');
      expect(ieIfsIssue.issue).toContain('Insufficient questions');
      expect(ieIfsIssue.issue).toContain('20');
      expect(ieIfsIssue.issue).toContain('40');
    });

    it('should report issues for papers with missing syllabus topics', async () => {
      ddbMock.reset();

      let queryCount = 0;
      const queryResponses = [
        { paper: 'JAIIB_IE_IFS', withTopic: 35, withoutTopic: 5 }, // 5 missing
        { paper: 'JAIIB_PPB', withTopic: 40, withoutTopic: 0 },
        { paper: 'JAIIB_AFB', withTopic: 40, withoutTopic: 0 },
        { paper: 'JAIIB_RBWM', withTopic: 40, withoutTopic: 0 },
      ];

      ddbMock.on(QueryCommand).callsFake((input: any) => {
        const response = queryResponses[queryCount];
        queryCount++;

        const items: any[] = [];
        
        // Add questions with topics
        for (let i = 0; i < response.withTopic; i++) {
          items.push({
            question_id: `q_${i}`,
            syllabus_topic: 'Valid Topic',
            paper: response.paper,
          });
        }
        
        // Add questions without topics
        for (let i = 0; i < response.withoutTopic; i++) {
          items.push({
            question_id: `q_missing_${i}`,
            syllabus_topic: '',
            paper: response.paper,
          });
        }

        return Promise.resolve({
          Items: items.map(item => marshall(item)),
        });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/validate-question-bank',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      };

      const result = await validateQuestionBank(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);

      // Should have an issue for JAIIB_IE_IFS
      const ieIfsIssue = body.issues.find(
        (issue: any) => issue.paper === 'JAIIB_IE_IFS' && issue.issue.includes('missing syllabus')
      );
      expect(ieIfsIssue).toBeDefined();
      expect(ieIfsIssue.severity).toBe('warning');
      expect(ieIfsIssue.issue).toContain('5');
      expect(ieIfsIssue.question_ids).toHaveLength(5);
    });

    it('should validate all four JAIIB papers', async () => {
      ddbMock.reset();

      ddbMock.on(QueryCommand).callsFake((input: any) => {
        const paper = input.ExpressionAttributeValues[':paper'];
        
        // Return 40 questions for each paper
        const items = Array(40).fill(null).map((_, i) => ({
          question_id: `q_${i}`,
          syllabus_topic: 'Valid Topic',
          paper,
        }));

        return Promise.resolve({
          Items: items.map(item => marshall(item)),
        });
      });

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/validate-question-bank',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      };

      const result = await validateQuestionBank(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);

      // Should have all four papers
      expect(body.papers['JAIIB_IE_IFS']).toBeDefined();
      expect(body.papers['JAIIB_PPB']).toBeDefined();
      expect(body.papers['JAIIB_AFB']).toBeDefined();
      expect(body.papers['JAIIB_RBWM']).toBeDefined();

      // All should be valid
      expect(body.papers['JAIIB_IE_IFS'].status).toBe('valid');
      expect(body.papers['JAIIB_PPB'].status).toBe('valid');
      expect(body.papers['JAIIB_AFB'].status).toBe('valid');
      expect(body.papers['JAIIB_RBWM'].status).toBe('valid');

      // Overall status should be valid
      expect(body.overall_status).toBe('valid');
    });
  });
});
