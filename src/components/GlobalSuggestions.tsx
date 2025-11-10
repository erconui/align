import React, { useMemo } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Suggestion {
  id: string;
  title: string;
}

interface GlobalSuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionSelect: (suggestion: Suggestion) => void;
  position: { x: number; y: number; width: number } | null;
  visible: boolean;
  searchText: string; // Add searchText prop
}

export const GlobalSuggestions = ({
  suggestions,
  onSuggestionSelect,
  position,
  visible,
  searchText
}: GlobalSuggestionsProps) => {
  // Filter suggestions based on search text
  const filteredSuggestions = useMemo(() =>
    suggestions.filter(template =>
      template.title.toLowerCase().startsWith(searchText.toLowerCase())
    ),
    [suggestions, searchText]
  );

  if (!visible || !filteredSuggestions.length || !position) return null;

  const screenHeight = Dimensions.get('window').height;

  // Determine if we should show above or below based on screen space
  const spaceBelow = screenHeight - position.y;
  const showAbove = spaceBelow < 200 && position.y > 200;

  const containerStyle = {
    ...styles.suggestionsContainer,
    position: 'absolute' as const,
    left: position.x,
    width: position.width,
    [showAbove ? 'bottom' : 'top']: showAbove ?
      (screenHeight - position.y) :
      position.y,
  };

  return (
    <View style={containerStyle}>
      <FlatList
        data={filteredSuggestions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => onSuggestionSelect(item)}
          >
            <Text style={styles.suggestionText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        style={styles.suggestionsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  suggestionsContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
  },
});