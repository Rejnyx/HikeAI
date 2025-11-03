import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Peak Model
 * Represents mountain peaks in the Czech Republic with their metadata
 */
const Peak = sequelize.define('Peak', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Basic information
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Primary name of the peak (e.g., "Lysá hora")'
  },

  nameVariants: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Alternative names and spellings (e.g., ["Lysá", "Lysa hora"])'
  },

  // Geographic data
  elevation: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Elevation in meters above sea level'
  },

  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    comment: 'Latitude coordinate'
  },

  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    comment: 'Longitude coordinate'
  },

  // Regional classification
  region: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Mountain range (e.g., "Beskydy", "Jeseníky", "Krkonoše")'
  },

  // Hiking metadata
  difficultyRating: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Difficulty level: "lehká", "střední", "náročná"'
  },

  // OpenStreetMap data
  osmId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'OpenStreetMap node/way ID for reference'
  },

  osmType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'OSM type: "node", "way", or "relation"'
  },

  // Popularity & usage tracking
  searchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times this peak was searched'
  },

  lastSearchedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this peak was searched by a user'
  },

  // Administrative
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this peak is active in the system'
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
  tableName: 'peaks',
  timestamps: true,
  indexes: [
    {
      name: 'idx_peak_name',
      fields: ['name']
    },
    {
      name: 'idx_peak_region',
      fields: ['region']
    },
    {
      name: 'idx_peak_coordinates',
      fields: ['latitude', 'longitude']
    },
    {
      name: 'idx_peak_search_count',
      fields: ['searchCount']
    }
  ]
});

/**
 * Class methods for Peak operations
 */
Peak.findByNameFuzzy = async function(searchName) {
  const peaks = await this.findAll({
    where: {
      isActive: true
    }
  });

  // Fuzzy match against name and variants
  return peaks.filter(peak => {
    const nameLower = peak.name.toLowerCase();
    const searchLower = searchName.toLowerCase();

    if (nameLower.includes(searchLower)) return true;

    if (peak.nameVariants) {
      return peak.nameVariants.some(variant =>
        variant.toLowerCase().includes(searchLower)
      );
    }

    return false;
  });
};

Peak.incrementSearchCount = async function(peakId) {
  await this.update(
    {
      searchCount: sequelize.literal('searchCount + 1'),
      lastSearchedAt: new Date()
    },
    {
      where: { id: peakId }
    }
  );
};

export default Peak;
