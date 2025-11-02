/**
 * Request Inbox Validation Utilities
 * Validates user requests before submitting to the queue
 */

/**
 * Validates a request object
 * @param {Object} request - The request to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateRequest(request) {
  const errors = [];

  // Required fields
  if (!request.title || typeof request.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (request.title.length < 5) {
    errors.push('Title must be at least 5 characters');
  } else if (request.title.length > 200) {
    errors.push('Title must not exceed 200 characters');
  }

  // Priority validation
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (request.priority && !validPriorities.includes(request.priority)) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
  }

  // Tags validation
  if (request.tags) {
    if (!Array.isArray(request.tags)) {
      errors.push('Tags must be an array');
    } else if (request.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    } else if (request.tags.some(tag => typeof tag !== 'string')) {
      errors.push('All tags must be strings');
    }
  }

  // Description validation
  if (request.description && typeof request.description !== 'string') {
    errors.push('Description must be a string');
  } else if (request.description && request.description.length > 2000) {
    errors.push('Description must not exceed 2000 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Counter for generating unique IDs within the same millisecond
let idCounter = 0;
let lastTimestamp = 0;

/**
 * Generates a unique request ID
 * @param {string} prefix - Prefix for the ID (default: 'REQ')
 * @returns {string} - Unique ID in format REQ-YYYYMMDD-NNN
 */
function generateRequestId(prefix = 'REQ') {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Use timestamp + counter for true uniqueness
  const timestamp = Date.now();

  // Reset counter if timestamp changed
  if (timestamp !== lastTimestamp) {
    idCounter = 0;
    lastTimestamp = timestamp;
  }

  // Use last 3 digits of timestamp + counter for unique suffix
  const suffix = String((timestamp % 1000) + idCounter).padStart(3, '0').slice(-3);
  idCounter++;

  return `${prefix}-${year}${month}${day}-${suffix}`;
}

/**
 * Validates request status transition
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - New status to transition to
 * @returns {boolean} - Whether transition is allowed
 */
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    'pending': ['in-discussion', 'rejected'],
    'in-discussion': ['specified', 'rejected'],
    'specified': ['in-progress', 'rejected'],
    'in-progress': ['completed', 'blocked'],
    'blocked': ['in-progress', 'rejected'],
    'completed': [],
    'rejected': []
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

module.exports = {
  validateRequest,
  generateRequestId,
  isValidStatusTransition
};
