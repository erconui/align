import React, { useMemo } from 'react';
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Suggestion } from '../stores/taskStore';


interface GlobalSuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionSelect: (suggestion: Suggestion) => void;
  position: { x: number; y: number; width: number } | null;
  visible: boolean;
  searchText: string; // Add searchText prop
  removeIds?: string[];
  keyboardHeight: number;
}

export const GlobalSuggestions = ({
  suggestions,
  onSuggestionSelect,
  position,
  visible,
  searchText,
  removeIds,
  keyboardHeight
}: GlobalSuggestionsProps) => {
  const { colors, styles } = useTheme();
  // Filter suggestions based on search text
  const filteredSuggestions = useMemo(() =>
    suggestions.filter(template => {
      const titleWords = template.title.toLowerCase().split(/\s+/);
      const query = searchText.toLowerCase();

      const matchesStart = titleWords.some(word => word.startsWith(query)) || template.title.toLocaleLowerCase().startsWith(query);

      return matchesStart && !removeIds?.includes(template.id);
    }),
    [suggestions, searchText, removeIds]
  );
  const duplicateTitles = useMemo(() => {
    const titles = filteredSuggestions.map(s => s.title);
    return titles.filter((title, index) => titles.indexOf(title) !== index);
  }, [filteredSuggestions]);

  if (!visible || !filteredSuggestions.length || !position) return null;

  const screenHeight = Dimensions.get('window').height;

  // Determine if we should show above or below based on screen space
  const spaceBelow = screenHeight - keyboardHeight - position.y;
  const showAbove = spaceBelow < 200 && position.y > 200;

  const containerStyle = {
    ...styles.suggestionsContainer,
    position: 'absolute' as const,
    left: position.x,
    width: position.width,
    [showAbove ? 'bottom' : 'top']: showAbove ?
      (screenHeight - 30 - position.y) :
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
            <Text style={styles.suggestionText}>{item.title}
  {duplicateTitles.includes(item.title) && ` (${item.parents.join('/')})`}</Text>
          </TouchableOpacity>
        )}
        style={styles.suggestionsList}
      />
    </View>
  );
};