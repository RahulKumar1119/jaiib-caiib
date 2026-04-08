/**
 * Unit Tests for Question Validation
 * Tests question text minimum length, option uniqueness, correct answer validation,
 * and paper/difficulty level validation
 * Requirements: 8.2, 8.3, 8.4, 3.7, 8.8
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { addQuestion } from '../index';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

// Mock DynamoDB
const ddbMock = mockClient(DynamoDBClient);

describe('Question Validation', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('Question Text Validation', () => {
    it('should reject question text with less than 10 characters', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'Short',
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('at least 10 characters');
    });

    it('should accept question text with exactly 10 characters', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: '1234567890',
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it('should reject empty question text', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: '',
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Option Uniqueness Validation', () => {
    it('should reject duplicate options', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: 'Delhi',
          option_c: 'Mumbai',
          option_d: 'Bangalore',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('unique');
    });

    it('should reject empty options', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: '',
          option_c: 'Mumbai',
          option_d: 'Bangalore',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('non-empty');
    });

    it('should accept all unique options', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: 'Mumbai',
          option_c: 'Bangalore',
          option_d: 'Chennai',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    it('should treat options as case-insensitive for uniqueness', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: 'delhi',
          option_c: 'Mumbai',
          option_d: 'Bangalore',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('unique');
    });
  });

  describe('Correct Answer Validation', () => {
    it('should reject invalid correct answer', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: 'Mumbai',
          option_c: 'Bangalore',
          option_d: 'Chennai',
          correct_answer: 'E',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('A, B, C, D');
    });

    it('should reject missing correct answer', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: 'Mumbai',
          option_c: 'Bangalore',
          option_d: 'Chennai',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    it('should accept valid correct answers A, B, C, D', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const validAnswers = ['A', 'B', 'C', 'D'];

      for (const answer of validAnswers) {
        const event: Partial<APIGatewayProxyEvent> = {
          path: '/admin/questions',
          httpMethod: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            question_text: 'What is the capital of India?',
            option_a: 'Delhi',
            option_b: 'Mumbai',
            option_c: 'Bangalore',
            option_d: 'Chennai',
            correct_answer: answer,
            paper: 'JAIIB_IE_IFS',
            difficulty_level: 'medium',
            syllabus_topic: 'RBI Functions',
          }),
        };

        const result = await addQuestion(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
      }
    });
  });

  describe('Paper Validation', () => {
    it('should reject invalid paper', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: 'Mumbai',
          option_c: 'Bangalore',
          option_d: 'Chennai',
          correct_answer: 'A',
          paper: 'INVALID_PAPER',
          difficulty_level: 'medium',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('JAIIB');
    });

    it('should accept all valid papers', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const validPapers = ['JAIIB_IE_IFS', 'JAIIB_PPB', 'JAIIB_AFB', 'JAIIB_RBWM'];
      const topicsByPaper: { [key: string]: string } = {
        JAIIB_IE_IFS: 'RBI Functions',
        JAIIB_PPB: 'Banking Fundamentals',
        JAIIB_AFB: 'Accounting Principles',
        JAIIB_RBWM: 'Retail Banking Products',
      };

      for (const paper of validPapers) {
        const event: Partial<APIGatewayProxyEvent> = {
          path: '/admin/questions',
          httpMethod: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            question_text: 'What is the capital of India?',
            option_a: 'Delhi',
            option_b: 'Mumbai',
            option_c: 'Bangalore',
            option_d: 'Chennai',
            correct_answer: 'A',
            paper,
            difficulty_level: 'medium',
            syllabus_topic: topicsByPaper[paper],
          }),
        };

        const result = await addQuestion(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
      }
    });
  });

  describe('Difficulty Level Validation', () => {
    it('should reject invalid difficulty level', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const event: Partial<APIGatewayProxyEvent> = {
        path: '/admin/questions',
        httpMethod: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          question_text: 'What is the capital of India?',
          option_a: 'Delhi',
          option_b: 'Mumbai',
          option_c: 'Bangalore',
          option_d: 'Chennai',
          correct_answer: 'A',
          paper: 'JAIIB_IE_IFS',
          difficulty_level: 'extreme',
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('easy, medium, hard');
    });

    it('should accept all valid difficulty levels', async () => {
      ddbMock.on(PutItemCommand).resolves({});

      const validDifficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of validDifficulties) {
        const event: Partial<APIGatewayProxyEvent> = {
          path: '/admin/questions',
          httpMethod: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            question_text: 'What is the capital of India?',
            option_a: 'Delhi',
            option_b: 'Mumbai',
            option_c: 'Bangalore',
            option_d: 'Chennai',
            correct_answer: 'A',
            paper: 'JAIIB_IE_IFS',
            difficulty_level: difficulty,
            syllabus_topic: 'RBI Functions',
          }),
        };

        const result = await addQuestion(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.success).toBe(true);
      }
    });
  });

  describe('Combined Validation', () => {
    it('should accept valid question with all required fields', async () => {
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
          rbi_norms: ['RBI Act 1934'],
          iibf_norms: ['IIBF Guide'],
          syllabus_topic: 'RBI Functions',
        }),
      };

      const result = await addQuestion(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.question.question_id).toBeDefined();
      expect(body.question.version).toBe(1);
    });
  });
});
