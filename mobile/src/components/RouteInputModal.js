import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { textStyles, fontSize, fontWeight } from '../theme/typography';

const QUICK_IDEAS = [
  { id: 'roundtrip', label: '🔄 Round trip', prompt: 'Make it a round trip back to start' },
  { id: 'train', label: '🚂 To train', prompt: 'End near a train station' },
  { id: 'easy', label: '👥 Easy route', prompt: 'Easy difficulty, suitable for beginners' },
  { id: 'peaks', label: '🏔️ Visit peaks', prompt: 'Include nearby mountain peaks' },
];

export default function RouteInputModal({
  visible,
  onClose,
  onGenerate,
  place,
  isGenerating = false,
  vagueError = null, // { message, suggestions: [...] }
}) {
  const [userInput, setUserInput] = useState('');
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(300)).current;

  console.log('🔵 RouteInputModal:', { visible, place: place?.name, isGenerating, vagueError });

  // Reset input when modal opens
  useEffect(() => {
    if (visible) {
      // Clear previous input when opening modal
      setUserInput('');
      setSelectedIdeas([]);
      setSelectedSuggestion(null);
    }
  }, [visible]);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleToggleIdea = (ideaId) => {
    if (selectedIdeas.includes(ideaId)) {
      setSelectedIdeas(selectedIdeas.filter(id => id !== ideaId));
    } else {
      setSelectedIdeas([...selectedIdeas, ideaId]);
    }
  };

  const buildPrompt = () => {
    const parts = [];

    // Build clean Czech prompt with destination
    if (place?.name) {
      const input = userInput.trim();
      const inputLower = input.toLowerCase();
      const placeLower = place.name.toLowerCase();

      // Check if user typed a COMPLETE sentence that already mentions the destination
      const hasCompleteRoute = input && (
        (inputLower.includes('trasa') && inputLower.includes(placeLower)) ||
        (inputLower.includes('na ' + placeLower)) ||
        (inputLower.includes('do ' + placeLower))
      );

      if (hasCompleteRoute) {
        // User wrote complete sentence with destination → use as-is
        parts.push(input);
      } else {
        // Combine place + user input
        const startInfo = selectedSuggestion || input;
        if (startInfo) {
          // Remove leading "z/od/from" if present to avoid duplication
          const cleanStart = startInfo.replace(/^(z|od|from)\s+/i, '');
          parts.push(`Trasa na ${place.name} z ${cleanStart}`);
        } else {
          parts.push(`Na ${place.name}`);
        }
      }
    } else if (userInput.trim()) {
      // No destination selected, just use user input
      parts.push(userInput.trim());
    }

    // Add quick ideas as additional constraints
    selectedIdeas.forEach(ideaId => {
      const idea = QUICK_IDEAS.find(i => i.id === ideaId);
      if (idea) parts.push(idea.prompt);
    });

    return parts.join('. ');
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion);
    // Auto-clear user input when suggestion is selected
    setUserInput('');
    // Dismiss keyboard to avoid extra tap
    Keyboard.dismiss();
  };

  const handleGenerate = () => {
    const prompt = buildPrompt();
    console.log('🚀 Generate clicked, prompt:', prompt);

    if (!prompt.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Chyba',
        text2: 'Prosím zadejte popis trasy nebo vyberte rychlé nápady',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    onGenerate(prompt);
  };

  const handleClose = () => {
    setUserInput('');
    setSelectedIdeas([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <Animated.View style={[styles.container, { transform: [{ translateY: modalTranslateY }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Naplánovat túru na {place?.name || 'cíl'}</Text>
            <TouchableOpacity onPress={handleClose} disabled={isGenerating}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Destination Breadcrumb */}
            {place?.name && (
              <View style={styles.breadcrumbSection}>
                <Text style={styles.breadcrumbLabel}>Cíl:</Text>
                <View style={styles.breadcrumbChip}>
                  <Text style={styles.breadcrumbText}>🎯 {place.name}</Text>
                </View>
              </View>
            )}

            {/* Vague Location Suggestions */}
            {vagueError && vagueError.suggestions && vagueError.suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.errorMessage}>{vagueError.message}</Text>
                <Text style={styles.label}>Vyberte výchozí bod:</Text>
                <View style={styles.suggestions}>
                  {vagueError.suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionChip,
                        selectedSuggestion === suggestion && styles.suggestionChipSelected
                      ]}
                      onPress={() => handleSuggestionSelect(suggestion)}
                      disabled={isGenerating}
                    >
                      <Text style={[
                        styles.suggestionText,
                        selectedSuggestion === suggestion && styles.suggestionTextSelected
                      ]}>
                        📍 {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Ideas */}
            <Text style={styles.label}>Rychlé nápady</Text>
            <View style={styles.quickIdeas}>
              {QUICK_IDEAS.map((idea) => {
                const isSelected = selectedIdeas.includes(idea.id);
                return (
                  <TouchableOpacity
                    key={idea.id}
                    style={[styles.ideaButton, isSelected && styles.ideaButtonSelected]}
                    onPress={() => handleToggleIdea(idea.id)}
                    disabled={isGenerating}
                  >
                    <Text style={[styles.ideaText, isSelected && styles.ideaTextSelected]}>
                      {idea.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Input */}
            <Text style={styles.label}>Nebo popiš svůj plán</Text>
            <TextInput
              style={styles.input}
              placeholder="Např. okružní trasa od parkoviště"
              placeholderTextColor={colors.text.secondary}
              multiline
              numberOfLines={3}
              value={userInput}
              onChangeText={setUserInput}
              editable={!isGenerating}
              textAlignVertical="top"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isGenerating}
            >
              <Text style={styles.cancelText}>Zrušit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.generateText}>Generuji...</Text>
                </>
              ) : (
                <Text style={styles.generateText}>⚡ Vygenerovat trasu</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    ...textStyles.cardTitle,
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  breadcrumbSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  breadcrumbLabel: {
    ...textStyles.captionSemibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  breadcrumbChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
  },
  breadcrumbText: {
    ...textStyles.smallSemibold,
    color: colors.text.inverse,
  },
  suggestionsSection: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
    borderRadius: borderRadius.base,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  errorMessage: {
    ...textStyles.secondaryMedium,
    color: colors.warning[700],
    marginBottom: spacing[3],
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  suggestionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary[300],
    backgroundColor: colors.background.primary,
  },
  suggestionChipSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[100],
  },
  suggestionText: {
    ...textStyles.smallMedium,
    color: colors.primary[700],
  },
  suggestionTextSelected: {
    color: colors.primary[800],
    fontWeight: fontWeight.semibold,
  },
  label: {
    ...textStyles.captionSemibold,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
  },
  quickIdeas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  ideaButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    backgroundColor: colors.background.primary,
  },
  ideaButtonSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  ideaText: {
    ...textStyles.smallMedium,
  },
  ideaTextSelected: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    ...textStyles.secondary,
    color: colors.text.primary,
    minHeight: 100,
    marginBottom: spacing[4],
  },
  examples: {
    backgroundColor: colors.primary[50],
    padding: spacing[3],
    borderRadius: borderRadius.base,
    marginBottom: spacing[4],
  },
  exampleTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginBottom: spacing[2],
  },
  exampleText: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    lineHeight: 20,
    marginBottom: spacing[1],
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.base,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...textStyles.buttonSmall,
    color: colors.text.secondary,
  },
  generateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.base,
    backgroundColor: colors.primary[600],
  },
  buttonDisabled: {
    backgroundColor: colors.gray[400],
  },
  generateText: {
    ...textStyles.buttonSmall,
    color: colors.text.inverse,
  },
});
