import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Peak from './Peak.js';
import POI from './POI.js';

/**
 * PeakPOI Relationship Model
 * Maps relationships between peaks and nearby POIs with metadata
 */
const PeakPOI = sequelize.define('PeakPOI', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  peakId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'peaks',
      key: 'id'
    },
    comment: 'Reference to Peak'
  },

  poiId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pois',
      key: 'id'
    },
    comment: 'Reference to POI'
  },

  // Distance and accessibility
  distanceKm: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    comment: 'Distance from peak to POI in kilometers'
  },

  estimatedTimeMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated hiking time from POI to peak in minutes'
  },

  // Relationship type
  relationshipType: {
    type: DataTypes.ENUM('trailhead', 'access_point', 'nearby_service', 'emergency'),
    allowNull: false,
    comment: 'Type of relationship between peak and POI'
  },

  // Hiking context
  isPrimaryAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is the primary/recommended access point for this peak'
  },

  trailQuality: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Trail quality: "výborná", "dobrá", "průměrná", "špatná"'
  },

  trailMarking: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Trail marking color/type (e.g., "červená", "modrá", "žlutá")'
  },

  elevationGainMeters: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Total elevation gain from POI to peak in meters'
  },

  // Usage and popularity
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times users took routes using this peak-POI combination'
  },

  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this relationship was used in route generation'
  },

  // Quality metadata
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this relationship has been verified'
  },

  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this relationship was verified'
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about this peak-POI connection'
  },

  // Administrative
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this relationship is active'
  },

  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'peak_poi_relationships',
  timestamps: true,
  indexes: [
    {
      name: 'idx_peak_poi_peak_id',
      fields: ['peakId']
    },
    {
      name: 'idx_peak_poi_poi_id',
      fields: ['poiId']
    },
    {
      name: 'idx_peak_poi_distance',
      fields: ['distanceKm']
    },
    {
      name: 'idx_peak_poi_primary',
      fields: ['isPrimaryAccess']
    },
    {
      name: 'idx_peak_poi_usage',
      fields: ['usageCount']
    },
    {
      // Composite unique index to prevent duplicates
      name: 'idx_peak_poi_unique',
      unique: true,
      fields: ['peakId', 'poiId']
    }
  ]
});

/**
 * Define associations
 */
Peak.belongsToMany(POI, {
  through: PeakPOI,
  foreignKey: 'peakId',
  otherKey: 'poiId',
  as: 'pois'
});

POI.belongsToMany(Peak, {
  through: PeakPOI,
  foreignKey: 'poiId',
  otherKey: 'peakId',
  as: 'peaks'
});

Peak.hasMany(PeakPOI, { foreignKey: 'peakId', as: 'peakPOIRelations' });
POI.hasMany(PeakPOI, { foreignKey: 'poiId', as: 'poiPeakRelations' });
PeakPOI.belongsTo(Peak, { foreignKey: 'peakId', as: 'peak' });
PeakPOI.belongsTo(POI, { foreignKey: 'poiId', as: 'poi' });

/**
 * Class methods for PeakPOI operations
 */

/**
 * Find all POIs for a specific peak
 * @param {number} peakId - Peak ID
 * @param {string} poiType - Optional POI type filter
 * @returns {Promise<Array>} Array of POIs with relationship metadata
 */
PeakPOI.findPOIsForPeak = async function(peakId, poiType = null) {
  const whereClause = {
    peakId: peakId,
    isActive: true
  };

  const include = [{
    model: POI,
    as: 'poi',
    where: { isActive: true }
  }];

  if (poiType) {
    include[0].where.type = poiType;
  }

  return await this.findAll({
    where: whereClause,
    include: include,
    order: [
      ['isPrimaryAccess', 'DESC'],
      ['distanceKm', 'ASC']
    ]
  });
};

/**
 * Find all peaks for a specific POI
 * @param {number} poiId - POI ID
 * @returns {Promise<Array>} Array of peaks with relationship metadata
 */
PeakPOI.findPeaksForPOI = async function(poiId) {
  return await this.findAll({
    where: {
      poiId: poiId,
      isActive: true
    },
    include: [{
      model: Peak,
      as: 'peak',
      where: { isActive: true }
    }],
    order: [
      ['distanceKm', 'ASC']
    ]
  });
};

/**
 * Find primary access POI for a peak by type
 * @param {number} peakId - Peak ID
 * @param {string} poiType - POI type (e.g., 'parking')
 * @returns {Promise<Object>} Primary POI or null
 */
PeakPOI.findPrimaryAccessPOI = async function(peakId, poiType) {
  return await this.findOne({
    where: {
      peakId: peakId,
      isPrimaryAccess: true,
      isActive: true
    },
    include: [{
      model: POI,
      as: 'poi',
      where: {
        type: poiType,
        isActive: true
      }
    }]
  });
};

/**
 * Create or update peak-POI relationship
 * @param {number} peakId - Peak ID
 * @param {number} poiId - POI ID
 * @param {object} data - Relationship data
 * @returns {Promise<Object>} Created or updated relationship
 */
PeakPOI.upsertRelationship = async function(peakId, poiId, data) {
  const [relationship, created] = await this.findOrCreate({
    where: { peakId, poiId },
    defaults: data
  });

  if (!created && data) {
    await relationship.update(data);
  }

  return relationship;
};

/**
 * Increment usage counter for a relationship
 * @param {number} peakId - Peak ID
 * @param {number} poiId - POI ID
 */
PeakPOI.incrementUsageCount = async function(peakId, poiId) {
  await this.update(
    {
      usageCount: sequelize.literal('usageCount + 1'),
      lastUsedAt: new Date()
    },
    {
      where: { peakId, poiId }
    }
  );
};

/**
 * Find nearest POI to a peak by type
 * @param {number} peakId - Peak ID
 * @param {string} poiType - POI type
 * @returns {Promise<Object>} Nearest POI or null
 */
PeakPOI.findNearestPOI = async function(peakId, poiType) {
  return await this.findOne({
    where: {
      peakId: peakId,
      isActive: true
    },
    include: [{
      model: POI,
      as: 'poi',
      where: {
        type: poiType,
        isActive: true
      }
    }],
    order: [['distanceKm', 'ASC']]
  });
};

/**
 * Get POI statistics for a peak
 * @param {number} peakId - Peak ID
 * @returns {Promise<Object>} Statistics object
 */
PeakPOI.getStatisticsForPeak = async function(peakId) {
  const relationships = await this.findAll({
    where: {
      peakId: peakId,
      isActive: true
    },
    include: [{
      model: POI,
      as: 'poi',
      where: { isActive: true }
    }]
  });

  const stats = {
    total: relationships.length,
    byType: {},
    nearestDistance: null,
    primaryAccess: null
  };

  relationships.forEach(rel => {
    const type = rel.poi.type;
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    if (stats.nearestDistance === null || rel.distanceKm < stats.nearestDistance) {
      stats.nearestDistance = parseFloat(rel.distanceKm);
    }

    if (rel.isPrimaryAccess) {
      stats.primaryAccess = rel.poi.type;
    }
  });

  return stats;
};

export default PeakPOI;
