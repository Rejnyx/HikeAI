import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Analytics Model
 * Tracks route generation attempts, errors, user selections, and performance metrics
 */
const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Event classification
  eventType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'route_attempt, vague_error, suggestion_selected, success, failure'
  },

  // User input data
  userPrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raw user input/prompt'
  },

  selectedPlace: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Destination name from autocomplete'
  },

  // Error tracking
  errorType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'vague:parking, vague:location, geocoding_failed, routing_failed, etc.'
  },

  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message shown to user'
  },

  // Suggestion tracking
  suggestionsOffered: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of suggestions offered to user'
  },

  suggestionSelected: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Which suggestion user selected'
  },

  // Quick ideas tracking
  quickIdeasSelected: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of quick idea IDs selected (roundtrip, train, easy, peaks)'
  },

  // Performance metrics
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Response time in milliseconds'
  },

  // Success tracking
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether route generation succeeded'
  },

  // Additional context
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional contextual data (IP hash, user agent, etc.)'
  },

  // Timestamp
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'analytics',
  timestamps: false, // We use our own timestamp field
  indexes: [
    { fields: ['eventType'] },
    { fields: ['timestamp'] },
    { fields: ['errorType'] },
    { fields: ['success'] }
  ]
});

/**
 * Helper methods for common analytics operations
 */

// Log route generation attempt
Analytics.logRouteAttempt = async function(data) {
  return await Analytics.create({
    eventType: 'route_attempt',
    userPrompt: data.userPrompt,
    selectedPlace: data.selectedPlace,
    quickIdeasSelected: data.quickIdeasSelected,
    metadata: data.metadata
  });
};

// Log vague location error
Analytics.logVagueError = async function(data) {
  return await Analytics.create({
    eventType: 'vague_error',
    userPrompt: data.userPrompt,
    selectedPlace: data.selectedPlace,
    errorType: data.errorType,
    errorMessage: data.errorMessage,
    suggestionsOffered: data.suggestionsOffered,
    metadata: data.metadata
  });
};

// Log suggestion selection
Analytics.logSuggestionSelected = async function(data) {
  return await Analytics.create({
    eventType: 'suggestion_selected',
    suggestionSelected: data.suggestionSelected,
    selectedPlace: data.selectedPlace,
    metadata: data.metadata
  });
};

// Log successful route generation
Analytics.logSuccess = async function(data) {
  return await Analytics.create({
    eventType: 'success',
    userPrompt: data.userPrompt,
    selectedPlace: data.selectedPlace,
    responseTime: data.responseTime,
    success: true,
    metadata: data.metadata
  });
};

// Log failed route generation
Analytics.logFailure = async function(data) {
  return await Analytics.create({
    eventType: 'failure',
    userPrompt: data.userPrompt,
    selectedPlace: data.selectedPlace,
    errorType: data.errorType,
    errorMessage: data.errorMessage,
    responseTime: data.responseTime,
    success: false,
    metadata: data.metadata
  });
};

// Get analytics insights
Analytics.getInsights = async function(options = {}) {
  const { startDate, endDate, eventType } = options;

  const where = {};
  if (startDate) where.timestamp = { [sequelize.Sequelize.Op.gte]: startDate };
  if (endDate) where.timestamp = { [sequelize.Sequelize.Op.lte]: endDate };
  if (eventType) where.eventType = eventType;

  return await Analytics.findAll({
    where,
    order: [['timestamp', 'DESC']],
    limit: options.limit || 100
  });
};

// Get vague error statistics
Analytics.getVagueErrorStats = async function() {
  const vagueErrors = await Analytics.findAll({
    where: { eventType: 'vague_error' },
    attributes: ['errorType', [sequelize.fn('COUNT', 'id'), 'count']],
    group: ['errorType']
  });

  return vagueErrors.map(err => ({
    errorType: err.errorType,
    count: parseInt(err.getDataValue('count'))
  }));
};

// Get most common user terms
Analytics.getMostCommonTerms = async function(limit = 20) {
  const prompts = await Analytics.findAll({
    where: {
      userPrompt: { [sequelize.Sequelize.Op.ne]: null }
    },
    attributes: ['userPrompt']
  });

  // Simple word frequency analysis
  const wordMap = {};
  prompts.forEach(p => {
    const words = p.userPrompt.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 2) { // Ignore very short words
        wordMap[word] = (wordMap[word] || 0) + 1;
      }
    });
  });

  return Object.entries(wordMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

export default Analytics;
