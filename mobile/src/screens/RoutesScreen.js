import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  SectionList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
  Animated,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import {
  Search,
  Plus,
  ChevronDown,
  SlidersHorizontal,
  Users,
  MapPin,
  Mountain,
  Building2,
  TreePine,
  Waves,
  Landmark,
  Church,
  TreeDeciduous,
  X,
  Navigation,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import axios from 'axios';
import { colors } from '../theme/colors';
import { textStyles, fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import PlaceDetailSheet from '../components/PlaceDetailSheet';
import RouteInputModal from '../components/RouteInputModal';

// API configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.149:3000/api/v1';

const { width, height } = Dimensions.get('window');

// Helper: Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(1); // Return distance in km with 1 decimal
};

// Helper: Calculate estimated hiking time based on distance and difficulty
// Using Naismith's rule: 1 hour per 5km + 1 hour per 600m elevation
const calculateEstimatedTime = (distanceKm, difficulty, elevationGain = null) => {
  let baseTimeHours = distanceKm / 5; // Naismith's rule base

  // Adjust for difficulty
  const difficultyMultipliers = {
    easy: 0.9,
    moderate: 1.0,
    difficult: 1.2,
    hard: 1.4,
  };
  const multiplier = difficultyMultipliers[difficulty] || 1.0;

  // Add elevation gain time if available
  if (elevationGain) {
    baseTimeHours += elevationGain / 600;
  }

  const totalHours = baseTimeHours * multiplier;

  // Format output
  if (totalHours < 1) {
    return `${Math.round(totalHours * 60)} min`;
  } else {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

// Helper: Get region from GPS coordinates
const getRegionFromCoordinates = (lat, lng) => {
  // Beskydy (Moravskoslezské Beskydy, Slezské Beskydy)
  if (lat >= 49.4 && lat <= 49.7 && lng >= 18.2 && lng <= 18.9) {
    return 'Beskydy';
  }
  // Jizerské hory
  if (lat >= 50.8 && lat <= 51.0 && lng >= 15.0 && lng <= 15.5) {
    return 'Jizerské hory';
  }
  // Krkonoše
  if (lat >= 50.6 && lat <= 50.8 && lng >= 15.4 && lng <= 16.0) {
    return 'Krkonoše';
  }
  // Jeseníky
  if (lat >= 50.0 && lat <= 50.3 && lng >= 16.9 && lng <= 17.4) {
    return 'Jeseníky';
  }
  // Králický Sněžník
  if (lat >= 50.1 && lat <= 50.3 && lng >= 16.8 && lng <= 17.2) {
    return 'Králický Sněžník';
  }
  // Šumava
  if (lat >= 48.8 && lat <= 49.2 && lng >= 13.3 && lng <= 13.9) {
    return 'Šumava';
  }
  // Orlické hory
  if (lat >= 50.2 && lat <= 50.4 && lng >= 16.3 && lng <= 16.6) {
    return 'Orlické hory';
  }
  // Krušné hory
  if (lat >= 50.5 && lat <= 50.7 && lng >= 13.0 && lng <= 14.0) {
    return 'Krušné hory';
  }
  return null;
};

// Helper: Get icon for location type
const getLocationIcon = (type, label) => {
  const labelLower = (label || '').toLowerCase();

  // Mountains & peaks
  if (labelLower.includes('hora') || labelLower.includes('kopec') ||
      labelLower.includes('vrchol') || labelLower.includes('výškový bod') ||
      labelLower.includes('peak') || labelLower.includes('mountain')) {
    return Mountain;
  }

  // Water features
  if (labelLower.includes('jezero') || labelLower.includes('řeka') ||
      labelLower.includes('potok') || labelLower.includes('vodní') ||
      labelLower.includes('lake') || labelLower.includes('river')) {
    return Waves;
  }

  // Forests & nature
  if (labelLower.includes('les') || labelLower.includes('park') ||
      labelLower.includes('přírodní') || labelLower.includes('forest')) {
    return TreePine;
  }

  // Religious sites
  if (labelLower.includes('kostel') || labelLower.includes('církev') ||
      labelLower.includes('klášter') || labelLower.includes('kaple') ||
      labelLower.includes('church') || labelLower.includes('chapel')) {
    return Church;
  }

  // Landmarks & viewpoints
  if (labelLower.includes('rozhledna') || labelLower.includes('památka') ||
      labelLower.includes('vyhlídka') || labelLower.includes('tower')) {
    return Landmark;
  }

  // Cities & municipalities
  if (type?.includes('regional') || type?.includes('municipality') ||
      labelLower.includes('obec') || labelLower.includes('město') ||
      labelLower.includes('vesnice') || labelLower.includes('city')) {
    return Building2;
  }

  // Default: MapPin
  return MapPin;
};

// Helper: Categorize suggestions into groups
const categorizeSuggestions = (suggestions) => {
  const groups = {
    peaks: [],
    cities: [],
    other: [],
  };

  suggestions.forEach(item => {
    const labelLower = (item.label || '').toLowerCase();

    // Mountains & peaks
    if (labelLower.includes('hora') || labelLower.includes('kopec') ||
        labelLower.includes('vrchol') || labelLower.includes('výškový bod') ||
        labelLower.includes('peak') || labelLower.includes('mountain')) {
      groups.peaks.push(item);
    }
    // Cities & municipalities
    else if (item.type?.includes('regional') || item.type?.includes('municipality') ||
             labelLower.includes('obec') || labelLower.includes('město') ||
             labelLower.includes('vesnice') || labelLower.includes('city')) {
      groups.cities.push(item);
    }
    // Everything else
    else {
      groups.other.push(item);
    }
  });

  // Build sections array
  const sections = [];
  if (groups.peaks.length > 0) {
    sections.push({ title: 'Vrcholy', data: groups.peaks });
  }
  if (groups.cities.length > 0) {
    sections.push({ title: 'Města a obce', data: groups.cities });
  }
  if (groups.other.length > 0) {
    sections.push({ title: 'Ostatní', data: groups.other });
  }

  return sections;
};

export default function RoutesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('Turistika');
  const [distanceFilter, setDistanceFilter] = useState('30 km');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showDistancePicker, setShowDistancePicker] = useState(false);
  const [poiMarkers, setPoiMarkers] = useState([]);
  const [showRouteInputModal, setShowRouteInputModal] = useState(false);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [generatedRoute, setGeneratedRoute] = useState(null);
  const [placeForRouting, setPlaceForRouting] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Routes from database
  const [routes, setRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  const bottomSheetRef = useRef(null);
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const activities = ['Turistika', 'Cyklistika', 'Běh', 'Lyžování'];
  const distances = ['5 km', '10 km', '20 km', '30 km', '50 km+'];

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);

  const handleSheetChanges = useCallback((index) => {
    console.log('Bottom sheet index:', index);
    // Load routes when user opens the bottom sheet
    if (index > -1 && routes.length === 0 && !isLoadingRoutes) {
      fetchRoutes();
    }
  }, [routes.length, isLoadingRoutes]);

  const handleRoutePress = (route) => {
    setSelectedRoute(route);
    // Center map on route - convert waypoints to coordinates
    if (mapRef.current && route.waypoints && Array.isArray(route.waypoints) && route.waypoints.length > 0) {
      const coordinates = route.waypoints.map(wp => ({
        latitude: wp.lat,
        longitude: wp.lng,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  // Search handler with debounce
  const handleSearch = async (text) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Hide suggestions if search is empty
    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    // Debounce API call (500ms) - včetně state changes!
    searchTimeoutRef.current = setTimeout(async () => {
      // Show loading POUZE po debounce delay
      setIsSearching(true);
      setShowSuggestions(true);

      try {
        const response = await axios.get(`${API_URL}/places/suggest`, {
          params: { query: text, limit: 10 },
          timeout: 5000,
        });

        if (response.data.success) {
          setSuggestions(response.data.suggestions);

          // Add POI markers to map (only peaks, mountains, landmarks)
          const pois = response.data.suggestions.filter(s =>
            s.type === 'poi' ||
            s.label?.toLowerCase().includes('hora') ||
            s.label?.toLowerCase().includes('vrchol') ||
            s.label?.toLowerCase().includes('výškový bod')
          );
          setPoiMarkers(pois);
        }
      } catch (error) {
        console.error('Search error:', error.message);
        setSuggestions([]);
        setPoiMarkers([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    // DON'T clear suggestions - keep them for re-open!

    // Center map on selected location
    if (mapRef.current && suggestion.location) {
      mapRef.current.animateToRegion({
        latitude: suggestion.location.lat,
        longitude: suggestion.location.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }

    // Open PlaceDetailSheet
    setSelectedPlace(suggestion);
    setShowPlaceDetail(true);
    console.log('Selected place:', suggestion);
  };

  // Handle search input focus - show suggestions if exist
  const handleSearchFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle map press - reverse geocode to find place
  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('Map pressed:', latitude, longitude);

    try {
      const response = await axios.get(`${API_URL}/places/detail`, {
        params: {
          lat: latitude.toFixed(5),
          lng: longitude.toFixed(5),
        },
        timeout: 5000,
      });

      if (response.data.success && response.data.place) {
        const place = response.data.place;

        // Create place object compatible with PlaceDetailSheet
        const placeData = {
          id: `mapclick_${Date.now()}_${latitude.toFixed(6)}_${longitude.toFixed(6)}`,
          name: place.name,
          label: place.label,
          type: place.type || 'location',
          location: {
            lat: latitude,
            lng: longitude,
          },
          elevation: place.elevation,
        };

        // Open PlaceDetailSheet
        setSelectedPlace(placeData);
        setShowPlaceDetail(true);
        console.log('Found place:', placeData);
      }
    } catch (error) {
      console.error('Map press reverse geocode error:', error.message);
      // User klikl na místo kde není žádné POI - ignorujeme
    }
  };

  // Handle route generation with AI
  const handleGenerateRoute = async (prompt) => {
    setIsGeneratingRoute(true);
    console.log('🚀 Generating route with prompt:', prompt);

    try {
      const response = await axios.post(
        `${API_URL}/routes/generate`,
        { prompt },
        { timeout: 60000 } // 60s timeout for AI generation
      );

      if (response.data.success) {
        const route = response.data.route;
        console.log('✅ Route generated:', route.name);
        console.log('📍 Waypoints:', route.waypoints?.length, 'POIs:', route.points_of_interest?.length);

        // Store generated route
        setGeneratedRoute(route);

        // Close modal
        setShowRouteInputModal(false);

        // Reload routes list to include new route
        fetchRoutes();

        // Center map on route
        if (mapRef.current && Array.isArray(route.waypoints) && route.waypoints.length > 0) {
          const coordinates = route.waypoints.map(wp => ({
            latitude: wp.lat,
            longitude: wp.lng,
          }));

          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
            animated: true,
          });
        }

        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Route Generated!',
          text2: `${route.name} - ${route.distance_km}km`,
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Route generation failed:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Please try again or adjust your route parameters.',
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  // Fetch routes from API
  const fetchRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      console.log('📋 Fetching routes from API...');
      const response = await axios.get(`${API_URL}/routes`, {
        params: { limit: 20 },
        timeout: 10000,
      });

      if (response.data.success) {
        console.log(`✅ Loaded ${response.data.routes.length} routes`);
        setRoutes(response.data.routes);
      }
    } catch (error) {
      console.error('❌ Failed to load routes:', error.message);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Get user location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('❌ Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('✅ User location:', location.coords.latitude, location.coords.longitude);
      } catch (error) {
        console.error('❌ Failed to get location:', error.message);
      }
    })();
  }, []);

  // Don't load routes automatically on mount - only load when user opens bottom sheet
  // Routes will be loaded when needed (e.g., after generating a route or when user opens the sheet)

  // Animate backdrop fade in/out
  useEffect(() => {
    if (showSuggestions && suggestions.length > 0) {
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showSuggestions, suggestions.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const renderRouteCard = (route) => {
    // Convert API waypoints to coordinates for minimap
    const coordinates = route.waypoints && Array.isArray(route.waypoints)
      ? route.waypoints.map(wp => ({ latitude: wp.lat, longitude: wp.lng }))
      : [];

    const startCoord = route.start_coords
      ? { latitude: route.start_coords.lat, longitude: route.start_coords.lng }
      : coordinates[0];

    // Calculate distance from user to route start
    const distanceFromUser = userLocation && startCoord
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          startCoord.latitude,
          startCoord.longitude
        )
      : null;

    // Placeholder image for routes (can be improved with real images later)
    const imageUrl = route.image || 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800';

    return (
      <TouchableOpacity
        key={route.id}
        style={styles.routeCard}
        onPress={() => handleRoutePress(route)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: imageUrl }} style={styles.routeImage} />

        {/* Badges */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: colors.difficulty[route.difficulty] }]}>
            <Text style={styles.badgeText}>
              {route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)}
            </Text>
          </View>
          {distanceFromUser && (
            <View style={[styles.badge, { backgroundColor: colors.primary[600] }]}>
              <Navigation size={12} color={colors.text.inverse} />
              <Text style={styles.badgeText}>{distanceFromUser} km od vás</Text>
            </View>
          )}
        </View>

        {/* Mini map preview */}
        {startCoord && coordinates.length > 0 && (
          <View style={styles.miniMapContainer}>
            <MapView
              style={styles.miniMap}
              initialRegion={{
                latitude: startCoord.latitude,
                longitude: startCoord.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Polyline
                coordinates={coordinates}
                strokeColor={colors.map.route}
                strokeWidth={3}
              />
            </MapView>
          </View>
        )}

        {/* Route info */}
        <View style={styles.routeInfo}>
          <Text style={styles.routeName} numberOfLines={2}>
            {route.name}
          </Text>
          <View style={styles.routeMetadata}>
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <MapPin size={14} color={colors.text.secondary} />
                <Text style={styles.metadataText}>{route.distance_km} km</Text>
              </View>
              <View style={styles.metadataItem}>
                <Clock size={14} color={colors.text.secondary} />
                <Text style={styles.metadataText}>
                  {calculateEstimatedTime(route.distance_km, route.difficulty, route.elevation_gain)}
                </Text>
              </View>
              {route.elevation_gain && (
                <View style={styles.metadataItem}>
                  <TrendingUp size={14} color={colors.text.secondary} />
                  <Text style={styles.metadataText}>{route.elevation_gain}m ↑</Text>
                </View>
              )}
            </View>
            {route.times_viewed > 0 && (
              <View style={styles.metadataItem}>
                <Users size={14} color={colors.text.secondary} />
                <Text style={styles.metadataText}>{route.times_viewed} zhlédnutí</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 49.82,
            longitude: 18.26,
            latitudeDelta: 0.3,
            longitudeDelta: 0.3,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          {/* POI markers (mountains, peaks, landmarks) */}
          {poiMarkers.map((poi) => (
            <Marker
              key={poi.id}
              coordinate={{
                latitude: poi.location.lat,
                longitude: poi.location.lng,
              }}
              onPress={() => {
                setSelectedPlace(poi);
                setShowPlaceDetail(true);
                console.log('POI marker clicked:', poi.name);
              }}
            >
              <View style={styles.poiMarker}>
                <Mountain size={24} color={colors.error} />
                {poi.elevation && (
                  <Text style={styles.poiMarkerLabel}>{poi.elevation}m</Text>
                )}
              </View>
            </Marker>
          ))}

          {/* Route markers from database */}
          {routes.map((route) => {
            // Get start coordinate from API data
            const startCoord = route.start_coords
              ? { latitude: route.start_coords.lat, longitude: route.start_coords.lng }
              : null;

            if (!startCoord) return null;

            return (
              <Marker
                key={route.id}
                coordinate={startCoord}
                onPress={() => handleRoutePress(route)}
              >
                <View
                  style={[
                    styles.customMarker,
                    selectedRoute?.id === route.id && styles.customMarkerSelected,
                  ]}
                >
                  <MapPin
                    size={20}
                    color={selectedRoute?.id === route.id ? colors.map.selected : colors.map.marker}
                  />
                </View>
              </Marker>
            );
          })}

          {/* Selected route polyline */}
          {selectedRoute && selectedRoute.waypoints && Array.isArray(selectedRoute.waypoints) && (
            <Polyline
              coordinates={selectedRoute.waypoints.map(wp => ({
                latitude: wp.lat,
                longitude: wp.lng,
              }))}
              strokeColor={colors.map.route}
              strokeWidth={4}
            />
          )}

          {/* Generated AI route */}
          {generatedRoute && generatedRoute.waypoints && Array.isArray(generatedRoute.waypoints) && (
            <>
              {/* Route polyline */}
              <Polyline
                coordinates={generatedRoute.waypoints.map(wp => ({
                  latitude: wp.lat,
                  longitude: wp.lng,
                }))}
                strokeColor={colors.primary[600]}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />

              {/* Start marker (green) */}
              <Marker
                coordinate={{
                  latitude: generatedRoute.start_coords.lat,
                  longitude: generatedRoute.start_coords.lng,
                }}
                title="Start"
                pinColor="green"
              />

              {/* End marker (red) */}
              <Marker
                coordinate={{
                  latitude: generatedRoute.end_coords.lat,
                  longitude: generatedRoute.end_coords.lng,
                }}
                title="End"
                pinColor="red"
              />

              {/* POI markers from generated route */}
              {generatedRoute.points_of_interest?.map((poi, index) => (
                <Marker
                  key={`poi-${index}`}
                  coordinate={{
                    latitude: poi.lat,
                    longitude: poi.lng,
                  }}
                  title={poi.name}
                  description={poi.type}
                >
                  <View style={styles.routePoiMarker}>
                    <Mountain size={20} color={colors.primary[600]} />
                  </View>
                </Marker>
              ))}
            </>
          )}
        </MapView>

        {/* Top search bar and filters */}
        <View style={styles.topBar}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={handleSearchFocus}
              placeholder="Hledat místo..."
              placeholderTextColor={colors.text.secondary}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={colors.primary[600]} />
            )}
            {!isSearching && searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Suggestions dropdown with full-screen backdrop */}
          {showSuggestions && suggestions.length > 0 && (
            <Modal
              visible={true}
              transparent={true}
              animationType="none"
              onRequestClose={() => setShowSuggestions(false)}
            >
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={() => setShowSuggestions(false)}>
                  <Animated.View
                    style={[
                      styles.suggestionsBackdrop,
                      { opacity: backdropOpacity }
                    ]}
                  />
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback>
                  <View style={styles.suggestionsWrapper}>
                    <View style={styles.suggestionsContainer}>
                        <SectionList
                          sections={categorizeSuggestions(suggestions)}
                          keyExtractor={(item) => item.id}
                          keyboardShouldPersistTaps="handled"
                          renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeader}>
                              <Text style={styles.sectionHeaderText}>{title}</Text>
                            </View>
                          )}
                          renderItem={({ item }) => {
                            const IconComponent = getLocationIcon(item.type, item.label);
                            return (
                              <TouchableOpacity
                                style={styles.suggestionItem}
                                onPress={() => handleSuggestionSelect(item)}
                                activeOpacity={0.7}
                              >
                                <IconComponent size={18} color={colors.primary[600]} />
                                <View style={styles.suggestionTextContainer}>
                                  <Text style={styles.suggestionName}>{item.name}</Text>
                                  {item.label && (
                                    <Text style={styles.suggestionLabel}>{item.label}</Text>
                                  )}
                                </View>
                                {item.elevation && (
                                  <Text style={styles.suggestionElevation}>{item.elevation}m</Text>
                                )}
                              </TouchableOpacity>
                            );
                          }}
                          stickySectionHeadersEnabled={false}
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
            </Modal>
          )}

          {/* Plan New button */}
          <TouchableOpacity
            style={styles.planButton}
            activeOpacity={0.8}
            onPress={() => {
              setPlaceForRouting(null);
              setShowRouteInputModal(true);
            }}
          >
            <Plus size={20} color={colors.primary[600]} />
            <Text style={styles.planButtonText}>Nová trasa</Text>
          </TouchableOpacity>
        </View>

        {/* Filters bar */}
        <View style={styles.filtersBar}>
          {/* Activity selector */}
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.8}
            onPress={() => setShowActivityPicker(true)}
          >
            <Text style={styles.filterButtonText}>{selectedActivity}</Text>
            <ChevronDown size={16} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Distance filter */}
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.8}
            onPress={() => setShowDistancePicker(true)}
          >
            <Text style={styles.filterButtonText}>do {distanceFilter}</Text>
          </TouchableOpacity>

          {/* Filters button */}
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.8}
            onPress={() => console.log('Filters tapped - TODO: Show FilterSheet')}
          >
            <SlidersHorizontal size={16} color={colors.text.primary} />
            <Text style={styles.filterButtonText}>Filtry</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          handleIndicatorStyle={styles.sheetIndicator}
          backgroundStyle={styles.sheetBackground}
          enablePanDownToClose={true}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Summary header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {isLoadingRoutes ? 'Načítání...' : `${routes.length} tras`}
              </Text>
            </View>

            {/* Horizontal route cards */}
            {isLoadingRoutes ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary[600]} />
              </View>
            ) : routes.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.routeCardsContainer}
                snapToInterval={width * 0.85 + 16}
                decelerationRate="fast"
              >
                {routes.map(renderRouteCard)}
              </ScrollView>
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.text.secondary }}>
                  Zatím žádné trasy. Vygeneruj svou první trasu!
                </Text>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheet>

        {/* Place Detail Sheet */}
        <PlaceDetailSheet
          place={selectedPlace}
          visible={showPlaceDetail}
          userLocation={userLocation}
          onClose={() => setShowPlaceDetail(false)}
          onPlanRoute={(place) => {
            console.log('Plan route from:', place.name);
            setPlaceForRouting(place);
            setShowPlaceDetail(false);
            setShowRouteInputModal(true);
          }}
          onViewRoutes={(place) => {
            console.log('View routes near:', place.name);
            setShowPlaceDetail(false);
            // Open routes bottom sheet to show nearby routes
            if (bottomSheetRef.current) {
              bottomSheetRef.current.snapToIndex(2); // Expand to full view
            }
          }}
        />

        {/* Route Input Modal */}
        <RouteInputModal
          visible={showRouteInputModal}
          onClose={() => setShowRouteInputModal(false)}
          onGenerate={handleGenerateRoute}
          place={placeForRouting}
          isGenerating={isGeneratingRoute}
        />

        {/* Activity Picker Modal */}
        <Modal
          visible={showActivityPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowActivityPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowActivityPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Activity</Text>
                  {activities.map((activity) => (
                    <TouchableOpacity
                      key={activity}
                      style={[
                        styles.modalOption,
                        selectedActivity === activity && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedActivity(activity);
                        setShowActivityPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          selectedActivity === activity && styles.modalOptionTextSelected,
                        ]}
                      >
                        {activity}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Distance Picker Modal */}
        <Modal
          visible={showDistancePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDistancePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDistancePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Distance</Text>
                  {distances.map((distance) => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.modalOption,
                        distanceFilter === distance && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setDistanceFilter(distance);
                        setShowDistancePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          distanceFilter === distance && styles.modalOptionTextSelected,
                        ]}
                      >
                        {distance}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    ...textStyles.input,
  },
  modalContainer: {
    flex: 1,
  },
  suggestionsBackdrop: {
    position: 'absolute',
    top: 110, // Start below the search bar
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Opacity controlled by Animated.View
  },
  suggestionsWrapper: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 156,
  },
  suggestionsContainer: {
    maxHeight: 400,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.background.primary,
    minHeight: 56,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    ...textStyles.suggestionName,
  },
  suggestionLabel: {
    ...textStyles.suggestionLabel,
    marginTop: spacing[1],
  },
  suggestionElevation: {
    ...textStyles.elevation,
  },
  sectionHeader: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  sectionHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  planButtonText: {
    ...textStyles.bodySemibold,
    color: colors.primary[600],
  },

  // Filters bar
  filtersBar: {
    position: 'absolute',
    top: 120,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  filterButtonText: {
    ...textStyles.buttonSmall,
    color: colors.text.primary,
  },

  // Custom marker
  customMarker: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.map.marker,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  customMarkerSelected: {
    borderColor: colors.map.selected,
    backgroundColor: colors.map.selected + '20',
  },

  // POI markers (mountains, peaks)
  poiMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiMarkerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.error,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routePoiMarker: {
    backgroundColor: colors.primary[50],
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: colors.primary[600],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Bottom sheet
  sheetIndicator: {
    backgroundColor: colors.gray[300],
    width: 40,
    height: 4,
  },
  sheetBackground: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sheetContent: {
    paddingBottom: 40,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetTitle: {
    ...textStyles.sheetTitle,
  },

  // Route cards
  routeCardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  routeCard: {
    width: width * 0.85,
    borderRadius: 16,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    marginRight: 16,
  },
  routeImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.gray[200],
    resizeMode: 'cover',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    ...textStyles.badge,
  },
  miniMapContainer: {
    position: 'absolute',
    bottom: 80,
    right: 12,
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  routeInfo: {
    padding: 16,
  },
  routeName: {
    ...textStyles.cardTitle,
    marginBottom: spacing[2],
  },
  routeMetadata: {
    flexDirection: 'column',
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    ...textStyles.secondary,
    fontSize: fontSize.sm,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    ...textStyles.modalTitle,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  modalOptionText: {
    ...textStyles.bodyMedium,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: colors.primary[600],
    fontWeight: fontWeight.bold,
  },
});
