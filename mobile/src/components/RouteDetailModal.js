import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { X, MapPin, Clock, TrendingUp, Edit3 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { colors } from '../theme/colors';
import { textStyles, fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { API_ENDPOINTS, API_TIMEOUTS } from '../config/api';

const { width, height } = Dimensions.get('window');

export default function RouteDetailModal({ visible, route, onClose, onRouteUpdated }) {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!route) return null;

  // Handle route edit
  const handleEditRoute = async () => {
    if (editPrompt.trim().length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Příliš krátký požadavek',
        text2: 'Napiš alespoň 3 znaky',
        position: 'bottom',
      });
      return;
    }

    setIsEditing(true);

    try {
      console.log(`✏️ Editing route ${route.id}: "${editPrompt}"`);

      const response = await axios.patch(
        `${API_ENDPOINTS.ROUTES_BY_ID(route.id)}/edit`,
        { prompt: editPrompt },
        { timeout: API_TIMEOUTS.ROUTE_GENERATION }
      );

      if (response.data.success) {
        const updatedRoute = response.data.route;

        console.log('✅ Route edited successfully:', updatedRoute.name);

        Toast.show({
          type: 'success',
          text1: '✅ Trasa upravena!',
          text2: `${updatedRoute.name} - ${updatedRoute.distance_km}km`,
          position: 'bottom',
          visibilityTime: 3000,
        });

        // Clear input
        setEditPrompt('');

        // Notify parent component about update
        if (onRouteUpdated) {
          onRouteUpdated(updatedRoute);
        }
      }
    } catch (error) {
      console.error('❌ Route edit failed:', error.message);

      const errorMessage = error.response?.data?.message || 'Něco se nepovedlo. Zkus to znovu.';

      Toast.show({
        type: 'error',
        text1: 'Chyba při úpravě trasy',
        text2: errorMessage,
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Prepare map coordinates
  const coordinates = route.waypoints && Array.isArray(route.waypoints)
    ? route.waypoints.map(wp => ({
        latitude: wp.lat,
        longitude: wp.lng,
      }))
    : [];

  const startCoord = route.start_coords
    ? { latitude: route.start_coords.lat, longitude: route.start_coords.lng }
    : coordinates[0];

  const endCoord = route.end_coords
    ? { latitude: route.end_coords.lat, longitude: route.end_coords.lng }
    : coordinates[coordinates.length - 1];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {route.name}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Map */}
          {startCoord && coordinates.length > 0 && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: startCoord.latitude,
                  longitude: startCoord.longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {/* Route polyline */}
                <Polyline
                  coordinates={coordinates}
                  strokeColor={colors.primary[600]}
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />

                {/* Start marker */}
                {startCoord && (
                  <Marker
                    coordinate={startCoord}
                    title="Start"
                    pinColor="green"
                  />
                )}

                {/* End marker */}
                {endCoord && (
                  <Marker
                    coordinate={endCoord}
                    title="Cíl"
                    pinColor="red"
                  />
                )}
              </MapView>
            </View>
          )}

          {/* Route Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MapPin size={20} color={colors.primary[600]} />
              <Text style={styles.statValue}>{route.distance_km} km</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={20} color={colors.primary[600]} />
              <Text style={styles.statValue}>{route.estimated_duration_hours}h</Text>
            </View>
            {route.elevation_gain_m && (
              <View style={styles.statItem}>
                <TrendingUp size={20} color={colors.primary[600]} />
                <Text style={styles.statValue}>+{route.elevation_gain_m}m</Text>
              </View>
            )}
          </View>

          {/* Difficulty Badge */}
          {route.difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: colors.difficulty[route.difficulty] }]}>
              <Text style={styles.difficultyText}>
                {route.difficulty === 'easy' ? 'Lehká' : route.difficulty === 'moderate' ? 'Střední' : 'Těžká'}
              </Text>
            </View>
          )}

          {/* Description */}
          {route.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Popis</Text>
              <Text style={styles.descriptionText}>{route.description}</Text>
            </View>
          )}

          {/* AI Edit Section */}
          <View style={styles.editSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <Edit3 size={18} color={colors.primary[600]} />
              <Text style={[styles.sectionTitle, { marginLeft: spacing.xs, marginBottom: 0 }]}>
                Uprav trasu pomocí AI
              </Text>
            </View>

            <TextInput
              style={styles.editInput}
              value={editPrompt}
              onChangeText={setEditPrompt}
              placeholder="Např.: Udělej to o 2km kratší"
              placeholderTextColor={colors.text.secondary}
              multiline
              maxLength={200}
              editable={!isEditing}
            />

            <TouchableOpacity
              style={[styles.editButton, isEditing && styles.editButtonDisabled]}
              onPress={handleEditRoute}
              disabled={isEditing || editPrompt.trim().length < 3}
              activeOpacity={0.8}
            >
              {isEditing ? (
                <>
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                  <Text style={styles.editButtonText}>Upravuji trasu...</Text>
                </>
              ) : (
                <Text style={styles.editButtonText}>Upravit trasu</Text>
              )}
            </TouchableOpacity>

            {/* Quick edit suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>💡 Zkus:</Text>
              <View style={styles.suggestionChips}>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => setEditPrompt('Udělej to kratší')}
                  disabled={isEditing}
                >
                  <Text style={styles.chipText}>Kratší</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => setEditPrompt('Udělej to lehčí')}
                  disabled={isEditing}
                >
                  <Text style={styles.chipText}>Lehčí</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => setEditPrompt('Vyhni strmým kopcům')}
                  disabled={isEditing}
                >
                  <Text style={styles.chipText}>Bez kopců</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    ...textStyles.h2,
    flex: 1,
    marginRight: spacing[4],
  },
  closeButton: {
    padding: spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  mapContainer: {
    height: 300,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[4],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
  statValue: {
    ...textStyles.bodySemibold,
    fontSize: fontSize.lg,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
  },
  difficultyText: {
    ...textStyles.badge,
    color: colors.text.inverse,
  },
  descriptionContainer: {
    marginHorizontal: spacing[4],
    marginTop: spacing[5],
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing[3],
  },
  descriptionText: {
    ...textStyles.body,
    lineHeight: 22,
  },
  editSection: {
    marginHorizontal: spacing[4],
    marginTop: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  editInput: {
    ...textStyles.input,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginTop: spacing[3],
    marginBottom: spacing[3],
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  editButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  editButtonText: {
    ...textStyles.buttonLarge,
    color: colors.text.inverse,
  },
  suggestionsContainer: {
    marginTop: spacing[4],
  },
  suggestionsTitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  chipText: {
    ...textStyles.bodySmall,
    color: colors.primary[700],
    fontWeight: fontWeight.medium,
  },
});
