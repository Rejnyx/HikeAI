import Analytics from '../models/Analytics.js';

/**
 * Analytics Middleware
 * Logs route generation attempts and outcomes for learning purposes
 */

/**
 * Middleware to track route generation requests
 * Attaches analytics helper to req object
 */
export function analyticsMiddleware(req, res, next) {
  // Attach analytics helper to request
  req.analytics = {
    startTime: Date.now(),

    // Log route generation attempt
    logAttempt: async (data) => {
      try {
        await Analytics.logRouteAttempt({
          userPrompt: data.userPrompt || req.body?.prompt,
          selectedPlace: data.selectedPlace || req.body?.place,
          quickIdeasSelected: data.quickIdeasSelected,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.originalUrl
          }
        });
      } catch (error) {
        console.error('Analytics logging failed:', error);
        // Don't fail the request if analytics fails
      }
    },

    // Log vague error
    logVagueError: async (data) => {
      try {
        await Analytics.logVagueError({
          userPrompt: data.userPrompt || req.body?.prompt,
          selectedPlace: data.selectedPlace || req.body?.place,
          errorType: data.errorType,
          errorMessage: data.errorMessage,
          suggestionsOffered: data.suggestionsOffered,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.originalUrl
          }
        });
      } catch (error) {
        console.error('Analytics logging failed:', error);
      }
    },

    // Log success
    logSuccess: async (data) => {
      const responseTime = Date.now() - req.analytics.startTime;
      try {
        await Analytics.logSuccess({
          userPrompt: data.userPrompt || req.body?.prompt,
          selectedPlace: data.selectedPlace || req.body?.place,
          responseTime,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.originalUrl,
            routeLength: data.routeLength,
            waypoints: data.waypoints
          }
        });
      } catch (error) {
        console.error('Analytics logging failed:', error);
      }
    },

    // Log failure
    logFailure: async (data) => {
      const responseTime = Date.now() - req.analytics.startTime;
      try {
        await Analytics.logFailure({
          userPrompt: data.userPrompt || req.body?.prompt,
          selectedPlace: data.selectedPlace || req.body?.place,
          errorType: data.errorType,
          errorMessage: data.errorMessage,
          responseTime,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            endpoint: req.originalUrl
          }
        });
      } catch (error) {
        console.error('Analytics logging failed:', error);
      }
    }
  };

  next();
}

/**
 * Error handler middleware for analytics
 * Catches errors and logs them
 */
export function analyticsErrorHandler(err, req, res, next) {
  // Log error to analytics if middleware is attached
  if (req.analytics) {
    req.analytics.logFailure({
      errorType: 'server_error',
      errorMessage: err.message
    });
  }

  // Pass error to next error handler
  next(err);
}

export default analyticsMiddleware;
