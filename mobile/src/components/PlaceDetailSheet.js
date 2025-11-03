import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Mountain, Ruler, Navigation, Heart, ChevronDown, ChevronUp, List } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadow } from '../theme/spacing';
import { textStyles, fontSize, fontWeight } from '../theme/typography';
import { API_ENDPOINTS, API_TIMEOUTS } from '../config/api';
import { calculateDistance } from '../utils/distance';

const { width } = Dimensions.get('window');

/**
 * PlaceDetailSheet - Bottom sheet showing detailed place information
 *
 * @param {object} place - Place data from Mapy.cz suggest API
 * @param {boolean} visible - Control visibility
 * @param {function} onClose - Close handler
 * @param {function} onPlanRoute - "Plan Route Here" button handler
 * @param {object} userLocation - User's GPS location {latitude, longitude}
 */
export default function PlaceDetailSheet({ place, visible, onClose, onPlanRoute, onViewRoutes, userLocation }) {
  const sheetRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);
  const [description, setDescription] = useState(null);
  const [isLoadingDescription, setIsLoadingDescription] = useState(true);
  const [distanceFromUser, setDistanceFromUser] = useState(null);
  const [routesCount, setRoutesCount] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Bottom sheet snap points - ŘEŠÍ DRAG VS SCROLL KONFLIKT
  // Peek (25%) - Quick info
  // Main (70%) - Full details (VÝCHOZÍ - začíná zde)
  // Full (95%) - Extended (scrollable content)
  // Scroll funguje POUZE uvnitř content oblasti (BottomSheetScrollView)
  // Drag handle je jasně oddělený nahoře
  const snapPoints = useMemo(() => ['25%', '70%', '95%'], []);

  const handleSheetChange = useCallback((index) => {
    // When swiped down to closed
    if (index === -1 && onClose) {
      onClose();
    }
  }, [onClose]);

  // Toggle save/favorite
  const handleToggleSave = useCallback(() => {
    setIsSaved(!isSaved);
    console.log(isSaved ? 'Unsaved place:' : 'Saved place:', place.name);
    // TODO: Save to favorites in database
  }, [isSaved, place]);

  // Fetch Wikimedia photo
  useEffect(() => {
    if (!place) return;

    const fetchPhoto = async () => {
      setIsLoadingPhoto(true);

      try {
        // Backend tries: Wikipedia CZ → Wikimedia Commons → Unsplash API → Google Places Photos
        const response = await axios.get(API_ENDPOINTS.PLACES_PHOTO, {
          params: { name: place.name },
          timeout: API_TIMEOUTS.DEFAULT,
        });

        if (response.data.success && response.data.photoUrl) {
          setPhotoUrl(response.data.photoUrl);
          console.log(`📷 Loaded photo from ${response.data.source}:`, place.name);
        } else {
          // No photo found - will show placeholder
          setPhotoUrl(null);
          console.log('📷 No photo available for:', place.name);
        }
      } catch (error) {
        // Backend failed - show placeholder
        setPhotoUrl(null);
        console.log('📷 Photo fetch error:', error.message);
      } finally {
        setIsLoadingPhoto(false);
      }
    };

    fetchPhoto();
  }, [place]);

  // Fetch Wikipedia description
  useEffect(() => {
    if (!place) return;

    const fetchDescription = async () => {
      setIsLoadingDescription(true);

      try {
        const response = await axios.get(API_ENDPOINTS.PLACES_DESCRIPTION, {
          params: { name: place.name },
          timeout: API_TIMEOUTS.DEFAULT,
        });

        if (response.data.success && response.data.description) {
          setDescription(response.data.description);
          console.log('📝 Loaded description from Wikipedia:', place.name);
        } else {
          setDescription(null);
        }
      } catch (error) {
        console.log('📝 Description not found:', error.message);
        setDescription(null);
      } finally {
        setIsLoadingDescription(false);
      }
    };

    fetchDescription();
  }, [place]);

  // Calculate statistics (distance from user, routes count)
  useEffect(() => {
    if (!place) return;

    const fetchStats = async () => {
      setIsLoadingStats(true);

      try {
        // Calculate distance from user
        if (userLocation && place.location) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            place.location.lat,
            place.location.lng
          );
          setDistanceFromUser(distance);
        }

        // Fetch routes count near this place (within 5km radius)
        if (place.location) {
          const response = await axios.get(API_ENDPOINTS.ROUTES_LIST, {
            params: {
              lat: place.location.lat,
              lng: place.location.lng,
              radius: 5, // 5km radius
            },
            timeout: API_TIMEOUTS.DEFAULT,
          });

          if (response.data.success) {
            setRoutesCount(response.data.routes?.length || 0);
          }
        }
      } catch (error) {
        console.error('📊 Stats fetch error:', error.message);
        setRoutesCount(0);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [place, userLocation, calculateDistance]);

  if (!place || !visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={1} // Start at 70% (main view)
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose={true}
      handleIndicatorStyle={styles.sheetIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Photo - S PLACEHOLDER */}
        <View style={styles.photoContainer}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.photo}
              resizeMode="cover"
              onError={() => setPhotoUrl(null)}
            />
          ) : !isLoadingPhoto ? (
            <View style={styles.photoPlaceholderFinal}>
              <Mountain size={64} color={colors.primary[300]} strokeWidth={1.5} />
            </View>
          ) : null}
          {isLoadingPhoto && (
            <View style={styles.photoPlaceholder}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
            </View>
          )}
        </View>

        {/* Place Info - OPTIMALIZOVANÉ */}
        <View style={styles.infoContainer}>
          {/* Name & Actions - KOMPAKTNÍ HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.placeName}>{place.name}</Text>
              <View style={styles.metaRow}>
                {place.label && (
                  <Text style={styles.placeType}>{place.label}</Text>
                )}
                {place.elevation && (
                  <View style={styles.elevationBadge}>
                    <Mountain size={14} color={colors.primary[600]} />
                    <Text style={styles.elevationText}>{place.elevation}m</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaved && styles.saveButtonActive
              ]}
              onPress={handleToggleSave}
              activeOpacity={0.7}
            >
              <Heart
                size={20}
                color={isSaved ? colors.text.inverse : colors.text.secondary}
                fill={isSaved ? colors.text.inverse : 'transparent'}
                strokeWidth={isSaved ? 2.5 : 2}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Stats - VÝRAZNĚJŠÍ HIERARCHIE */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Navigation size={20} color={colors.primary[600]} />
              <View style={styles.statContent}>
                {isLoadingStats ? (
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                ) : (
                  <>
                    <Text style={styles.statValue}>
                      {distanceFromUser ? `${distanceFromUser} km` : '-'}
                    </Text>
                    <Text style={styles.statHint}>od vás</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ruler size={20} color={colors.primary[600]} />
              <View style={styles.statContent}>
                {isLoadingStats ? (
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                ) : (
                  <>
                    <Text style={styles.statValue}>{routesCount}</Text>
                    <Text style={styles.statHint}>tras v okolí</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Description - EXPANDABLE S GRADIENTEM */}
          {(isLoadingDescription || description) && (
            <>
              <Text style={styles.sectionTitle}>O tomto místě</Text>
              {isLoadingDescription ? (
                <View style={styles.descriptionSkeleton}>
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                  <Text style={styles.descriptionSkeletonText}>Načítání...</Text>
                </View>
              ) : (
                <View style={styles.descriptionWrapper}>
                  <View style={styles.descriptionContainer}>
                    <Text
                      style={styles.description}
                      numberOfLines={isDescriptionExpanded ? undefined : 3}
                    >
                      {description}
                    </Text>
                    {/* Gradient fade-out když je zkrácené */}
                    {!isDescriptionExpanded && description && description.length > 150 && (
                      <LinearGradient
                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
                        style={styles.descriptionGradient}
                        pointerEvents="none"
                      />
                    )}
                  </View>
                  {/* Zobrazit více/méně tlačítko */}
                  {description && description.length > 150 && (
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.expandButtonText}>
                        {isDescriptionExpanded ? 'Zobrazit méně' : 'Zobrazit více'}
                      </Text>
                      {isDescriptionExpanded ? (
                        <ChevronUp size={16} color={colors.primary[600]} />
                      ) : (
                        <ChevronDown size={16} color={colors.primary[600]} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {/* BOTTOM SPACING - ZMENŠENO (pouze pro padding pod obsahem) */}
        <View style={{ height: 20 }} />
      </BottomSheetScrollView>

      {/* Primary CTAs - STICKY DOLE (VŽDY VIDITELNÉ) */}
      <View style={styles.stickyButtonContainer}>
        {/* Primární CTA - Naplánovat trasu */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => onPlanRoute && onPlanRoute(place)}
          activeOpacity={0.8}
        >
          <Mountain size={20} color={colors.text.inverse} />
          <Text style={styles.primaryButtonText}>Naplánovat trasu</Text>
        </TouchableOpacity>

        {/* Sekundární CTA - Zobrazit trasy */}
        {routesCount > 0 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onViewRoutes && onViewRoutes(place)}
            activeOpacity={0.8}
          >
            <List size={18} color={colors.primary[600]} />
            <Text style={styles.secondaryButtonText}>
              Trasy v okolí ({routesCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetIndicator: {
    backgroundColor: colors.gray[300],
    width: 40,
    height: 4,
  },
  sheetBackground: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadow.xl,
  },
  sheetContent: {
    paddingBottom: spacing[2],
  },

  // Hero photo - ZMENŠENO
  photoContainer: {
    width: '100%',
    height: 160,
    backgroundColor: colors.gray[200],
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderFinal: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
  },

  // Info container - KOMPAKTNĚJŠÍ PADDING
  infoContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },

  // Header - KOMPAKTNĚJŠÍ
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  placeName: {
    ...textStyles.h1,
    marginBottom: 0,
  },
  placeType: {
    ...textStyles.small,
  },
  elevationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  elevationText: {
    ...textStyles.caption,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  saveButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  saveButtonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    ...shadow.sm,
  },

  // Stats - HORIZONTÁLNÍ, VÝRAZNĚJŠÍ PRO LEPŠÍ HIERARCHII
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.base,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statHint: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray[300],
    marginHorizontal: spacing[2],
  },

  // Description - EXPANDABLE S GRADIENTEM
  sectionTitle: {
    ...textStyles.bodySemibold,
    marginBottom: spacing[2],
  },
  descriptionWrapper: {
    width: '100%',
  },
  descriptionContainer: {
    position: 'relative',
  },
  description: {
    ...textStyles.secondary,
    lineHeight: 20,
  },
  descriptionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  descriptionSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  descriptionSkeletonText: {
    ...textStyles.small,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    marginTop: spacing[1],
  },
  expandButtonText: {
    ...textStyles.small,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },

  // Sticky Button Container - DVĚ TLAČÍTKA (FIXED LAYOUT)
  stickyButtonContainer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6], // Větší bottom padding pro safe area
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadow.lg,
    elevation: 10,
    gap: spacing[2],
  },

  // Primární CTA - Naplánovat trasu
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.base,
    paddingVertical: spacing[3],
    gap: spacing[2],
    // Silnější shadow pro lepší affordance
    ...shadow.md,
    elevation: 3,
  },
  primaryButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontWeight: fontWeight.bold,
  },

  // Sekundární CTA - Zobrazit trasy
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.base,
    borderWidth: 2,
    borderColor: colors.primary[600],
    paddingVertical: spacing[2.5],
    gap: spacing[2],
  },
  secondaryButtonText: {
    ...textStyles.button,
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
});
