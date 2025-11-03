import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * POI (Point of Interest) Model
 * Represents points of interest near Czech mountain peaks:
 * - Parking lots (parkoviště)
 * - Train stations (nádraží)
 * - Campsites (kempy)
 * - Mountain huts (horské chaty)
 */
const POI = sequelize.define('POI', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Basic information
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Name of the POI (e.g., "Parkoviště Praděd", "Ovčárna")'
  },

  type: {
    type: DataTypes.ENUM('parking', 'train_station', 'camp', 'mountain_hut'),
    allowNull: false,
    comment: 'Type of POI'
  },

  // Geographic data
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

  // Detailed information
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of the POI'
  },

  amenities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Available amenities (e.g., ["wifi", "restaurant", "shower", "toilets"])'
  },

  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Capacity (parking spaces, beds, camping spots)'
  },

  // Contact and operational info
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Contact phone number'
  },

  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Website URL'
  },

  openingHours: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Opening hours (if applicable)'
  },

  seasonalAvailability: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Seasonal availability (e.g., "celoročně", "květen-říjen")'
  },

  // Pricing
  priceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Price information (e.g., {"parking": "50 Kč/den", "bed": "400 Kč/noc"})'
  },

  isFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the POI is free to use'
  },

  // OpenStreetMap data
  osmId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'OpenStreetMap node/way/relation ID'
  },

  osmType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'OSM type: "node", "way", or "relation"'
  },

  osmTags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Raw OSM tags for reference'
  },

  // Hiking-specific metadata
  elevationGain: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Elevation at this POI in meters above sea level'
  },

  accessDifficulty: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Difficulty of access: "snadný", "střední", "náročný"'
  },

  // Popularity & usage tracking
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times this POI was viewed'
  },

  routeStartCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times users started routes from this POI'
  },

  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this POI was used in route generation'
  },

  // Quality & verification
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'community_verified', 'admin_verified'),
    defaultValue: 'unverified',
    comment: 'Verification status of POI data'
  },

  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the POI was last verified'
  },

  // Administrative
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this POI is active in the system'
  },

  isRecommended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is a recommended/featured POI'
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
  tableName: 'pois',
  timestamps: true,
  indexes: [
    {
      name: 'idx_poi_type',
      fields: ['type']
    },
    {
      name: 'idx_poi_coordinates',
      fields: ['latitude', 'longitude']
    },
    {
      name: 'idx_poi_name',
      fields: ['name']
    },
    {
      name: 'idx_poi_route_start_count',
      fields: ['routeStartCount']
    },
    {
      name: 'idx_poi_is_active',
      fields: ['isActive']
    }
  ]
});

/**
 * Class methods for POI operations
 */

/**
 * Find POIs by type within a bounding box
 * @param {string} type - POI type ('parking', 'train_station', 'camp', 'mountain_hut')
 * @param {object} bounds - { minLat, maxLat, minLng, maxLng }
 * @returns {Promise<Array>} Array of POIs
 */
POI.findByTypeInBounds = async function(type, bounds) {
  const { Op } = await import('sequelize');

  return await this.findAll({
    where: {
      type: type,
      isActive: true,
      latitude: {
        [Op.between]: [bounds.minLat, bounds.maxLat]
      },
      longitude: {
        [Op.between]: [bounds.minLng, bounds.maxLng]
      }
    },
    order: [['routeStartCount', 'DESC']]
  });
};

/**
 * Find POIs near a specific coordinate
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Radius in kilometers
 * @param {string} type - Optional POI type filter
 * @returns {Promise<Array>} Array of POIs with distance
 */
POI.findNearby = async function(lat, lng, radiusKm = 10, type = null) {
  // Haversine formula approximation for SQLite
  // 1 degree latitude ≈ 111km
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const { Op } = await import('sequelize');

  const whereClause = {
    isActive: true,
    latitude: {
      [Op.between]: [lat - latDelta, lat + latDelta]
    },
    longitude: {
      [Op.between]: [lng - lngDelta, lng + lngDelta]
    }
  };

  if (type) {
    whereClause.type = type;
  }

  const pois = await this.findAll({
    where: whereClause,
    raw: true
  });

  // Calculate actual distance and filter by radius
  return pois
    .map(poi => {
      const distance = this.calculateDistance(lat, lng, poi.latitude, poi.longitude);
      return { ...poi, distance };
    })
    .filter(poi => poi.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
POI.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Increment route start counter
 * @param {number} poiId - POI ID
 */
POI.incrementRouteStartCount = async function(poiId) {
  await this.update(
    {
      routeStartCount: sequelize.literal('routeStartCount + 1'),
      lastUsedAt: new Date()
    },
    {
      where: { id: poiId }
    }
  );
};

/**
 * Increment view counter
 * @param {number} poiId - POI ID
 */
POI.incrementViewCount = async function(poiId) {
  await this.update(
    {
      viewCount: sequelize.literal('viewCount + 1')
    },
    {
      where: { id: poiId }
    }
  );
};

/**
 * Get recommended POIs by type
 * @param {string} type - POI type
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of recommended POIs
 */
POI.getRecommended = async function(type = null, limit = 10) {
  const whereClause = {
    isActive: true,
    isRecommended: true
  };

  if (type) {
    whereClause.type = type;
  }

  return await this.findAll({
    where: whereClause,
    order: [['routeStartCount', 'DESC']],
    limit: limit
  });
};

export default POI;
