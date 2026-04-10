/**
 * Dashboard Lambda Handler
 * Handles dashboard metrics aggregation and performance tracking
 * Calculates average scores, highest scores, and recent results per JAIIB paper
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.3
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  ValidationError,
  DatabaseError,
  formatErrorResponse,
} from '/opt/nodejs/error-handling';
import { createLogger } from '/opt/nodejs/logging';
import {
  DYNAMODB_TABLES,
  HTTP_STATUS,
  JAIIB_PAPERS,
} from '/opt/nodejs/constants';

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const logger = createLogger({ service: 'DashboardHandler' });

// Constants
const DASHBOARD_TIMEOUT_MS = 1000;
const RECENT_SCORES_LIMIT = 10;
const VALID_PAPERS = [
  JAIIB_PAPERS.IE_IFS,
  JAIIB_PAPERS.PPB,
  JAIIB_PAPERS.AFB,
  JAIIB_PAPERS.RBWM,
];

interface PaperStats {
  average_score: number;
  highest_score: number;
  practice_count: number;
}

interface TrendDataPoint {
  date: string;
  average_score: number;
  practice_count: number;
  paper?: string;
}

interface PerformanceComparison {
  paper: string;
  average_score: number;
  highest_score: number;
  practice_count: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface DashboardMetrics {
  total_practice_sets: number;
  average_score: number;
  paper_stats: {
    [key: string]: PaperStats;
  };
  recent_scores: Array<{
    score_id: string;
    paper: string;
    score: number;
    created_at: number;
  }>;
  trend_data?: TrendDataPoint[];
  performance_comparison?: PerformanceComparison[];
}

/**
 * Calculate statistics for a specific paper
 * Returns average score, highest score, and practice count
 */
const calculatePaperStats = (scores: any[]): PaperStats => {
  if (scores.length === 0) {
    return {
      average_score: 0,
      highest_score: 0,
      practice_count: 0,
    };
  }

  const totalScore = scores.reduce((sum, score) => sum + (score.score || 0), 0);
  const averageScore = totalScore / scores.length;
  const highestScore = Math.max(...scores.map(s => s.score || 0));

  return {
    average_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
    highest_score: highestScore,
    practice_count: scores.length,
  };
};

/**
 * Calculate trend data for the last 30 days
 * Groups scores by date and calculates daily average
 */
const calculateTrendData = (scores: any[], paperFilter?: string): TrendDataPoint[] => {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Filter scores from last 30 days
  const recentScores = scores.filter(s => {
    const scoreTime = (s.created_at || 0) * 1000; // Convert to milliseconds
    return scoreTime >= thirtyDaysAgo && scoreTime <= now;
  });

  if (recentScores.length === 0) {
    return [];
  }

  // Group scores by date
  const scoresByDate: { [date: string]: number[] } = {};

  recentScores.forEach(score => {
    const scoreDate = new Date((score.created_at || 0) * 1000);
    const dateStr = scoreDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (!scoresByDate[dateStr]) {
      scoresByDate[dateStr] = [];
    }
    scoresByDate[dateStr].push(score.score || 0);
  });

  // Calculate daily averages and sort by date
  const trendData = Object.entries(scoresByDate)
    .map(([date, dailyScores]) => ({
      date,
      average_score: Math.round((dailyScores.reduce((a, b) => a + b, 0) / dailyScores.length) * 100) / 100,
      practice_count: dailyScores.length,
      paper: paperFilter,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return trendData;
};

/**
 * Calculate performance trend (improving, stable, declining)
 * Compares average score of first half vs second half of scores
 */
const calculatePerformanceTrend = (scores: any[]): 'improving' | 'stable' | 'declining' => {
  if (scores.length < 2) {
    return 'stable';
  }

  const midpoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, midpoint);
  const secondHalf = scores.slice(midpoint);

  const firstHalfAvg = firstHalf.reduce((sum, s) => sum + (s.score || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, s) => sum + (s.score || 0), 0) / secondHalf.length;

  const difference = secondHalfAvg - firstHalfAvg;

  if (difference > 5) {
    return 'improving';
  } else if (difference < -5) {
    return 'declining';
  }
  return 'stable';
};

/**
 * Generate performance comparison across all papers
 */
const generatePerformanceComparison = (allScores: any[]): PerformanceComparison[] => {
  const comparison: PerformanceComparison[] = [];

  for (const paper of VALID_PAPERS) {
    const paperScores = allScores.filter(s => s.paper === paper);
    if (paperScores.length === 0) continue;

    const stats = calculatePaperStats(paperScores);
    const trend = calculatePerformanceTrend(paperScores);

    comparison.push({
      paper,
      average_score: stats.average_score,
      highest_score: stats.highest_score,
      practice_count: stats.practice_count,
      trend,
    });
  }

  return comparison;
};

/**
 * GET /dashboard/metrics - Retrieve dashboard metrics for user
 * Calculates average score for each JAIIB paper
 * Calculates total practice sets completed
 * Retrieves highest score per paper
 * Retrieves recent 10 practice set results
 * Generates trend data for last 30 days
 * Generates performance comparison across papers
 * Requirements: 7.3, 7.6
 */
export const getMetrics = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  try {
    logger.info('Dashboard metrics requested', { path: event.path });

    // Extract user context from authorizer
    const authorizer = event.requestContext.authorizer as any;
    if (!authorizer || !authorizer.user_id || !authorizer.tenant_id) {
      return formatErrorResponse(
        new ValidationError('Missing user context in request')
      );
    }

    const userId = authorizer.user_id;
    const tenantId = authorizer.tenant_id;

    // Parse query parameters for optional paper filter
    const queryParams = event.queryStringParameters || {};
    const paperFilter = queryParams.paper as string | undefined;

    // Validate paper filter if provided
    if (paperFilter && !VALID_PAPERS.includes(paperFilter as any)) {
      return formatErrorResponse(
        new ValidationError(`Invalid paper: ${paperFilter}`)
      );
    }

    // Query all scores for the user
    let allScores: any[] = [];
    try {
      const queryCommand = new QueryCommand({
        TableName: DYNAMODB_TABLES.SCORES,
        KeyConditionExpression: 'tenant_id#user_id = :pk',
        ExpressionAttributeValues: marshall({
          ':pk': `${tenantId}#${userId}`,
        }),
        ScanIndexForward: false, // Sort by created_at descending
      });

      const response = await dynamoDb.send(queryCommand);

      if (response.Items) {
        allScores = response.Items.map(item => unmarshall(item));
      }

      logger.info('Retrieved scores for dashboard', {
        userId,
        tenantId,
        totalScores: allScores.length,
      });
    } catch (error) {
      logger.error('Failed to retrieve scores', { userId, error });
      throw new DatabaseError('Failed to retrieve scores');
    }

    // Filter scores by paper if specified
    const filteredScores = paperFilter
      ? allScores.filter(s => s.paper === paperFilter)
      : allScores;

    // Get recent scores (limit to 10)
    const recentScores = filteredScores.slice(0, RECENT_SCORES_LIMIT).map(score => ({
      score_id: score.score_id,
      paper: score.paper,
      score: score.score,
      created_at: score.created_at,
    }));

    // Calculate metrics for each paper
    const paperStats: { [key: string]: PaperStats } = {};

    // If paper filter is specified, only calculate for that paper
    if (paperFilter) {
      const paperScores = filteredScores;
      paperStats[paperFilter] = calculatePaperStats(paperScores);
    } else {
      // Calculate for all papers
      for (const paper of VALID_PAPERS) {
        const paperScores = allScores.filter(s => s.paper === paper);
        paperStats[paper] = calculatePaperStats(paperScores);
      }
    }

    // Calculate overall average score
    const totalScore = filteredScores.reduce((sum, score) => sum + (score.score || 0), 0);
    const overallAverageScore = filteredScores.length > 0
      ? Math.round((totalScore / filteredScores.length) * 100) / 100
      : 0;

    // Calculate total practice sets
    const totalPracticeSets = filteredScores.length;

    // Calculate trend data for last 30 days
    const trendData = calculateTrendData(filteredScores, paperFilter);

    // Generate performance comparison across papers
    const performanceComparison = !paperFilter ? generatePerformanceComparison(allScores) : undefined;

    // Verify response time is within 1 second target
    const responseTime = Date.now() - startTime;
    if (responseTime > DASHBOARD_TIMEOUT_MS) {
      logger.warn('Dashboard metrics exceeded 1 second target', {
        userId,
        responseTime,
      });
    }

    const metrics: DashboardMetrics = {
      total_practice_sets: totalPracticeSets,
      average_score: overallAverageScore,
      paper_stats: paperStats,
      recent_scores: recentScores,
      trend_data: trendData,
      performance_comparison: performanceComparison,
    };

    logger.info('Dashboard metrics calculated', {
      userId,
      totalPracticeSets,
      averageScore: overallAverageScore,
      responseTime,
    });

    return {
      statusCode: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        success: true,
        metrics,
      }),
    };
  } catch (error) {
    logger.error('Error retrieving dashboard metrics', { error });
    return formatErrorResponse(error as Error);
  }
};

/**
 * Lambda handler for routing requests
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Dashboard handler invoked', {
    method: event.httpMethod,
    path: event.path,
  });

  // Route to appropriate handler
  if (event.httpMethod === 'GET' && event.path.includes('/dashboard/metrics')) {
    return getMetrics(event);
  }

  return {
    statusCode: HTTP_STATUS.NOT_FOUND,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: false,
      error: 'Endpoint not found',
    }),
  };
};
