import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, FlatList, TouchableOpacity, View } from "react-native";

interface BaseNode {
  id: string;
  title: string;
  children?: BaseNode[];
}

interface TaskNode extends BaseNode {
  completed: boolean;
}

interface BaseItemProps<T extends BaseNode> {
  node: T;
  showCompletionToggle?: boolean;
  onToggleCompletion?: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubItem: (title: string, parentId: string | null) => void;
  onAddItemAfter: (title: string, afterId: string | null) => void;
  onUpdateTitle: (id: string, title: string) => void;
  focusedId: string | null;
  level?: number;
  suggestions: TaskTemplate[];
  replaceTemplate: (parentId: string, oldId: string, newId: string) => void;
  parentId: string | null;
}

export const BaseItem = <T extends BaseNode>({
  node,
  showCompletionToggle = false,
  onToggleCompletion,
  onDelete,
  onAddSubItem,
  onAddItemAfter,
  onUpdateTitle,
  focusedId,
  level = 0,
  suggestions,
  parentId
}: BaseItemProps<T>) => {
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const textInputRef = useRef<TextInput>(null);
const [showSuggestions, setShowSuggestions] = useState(false);

const filteredSuggestions = suggestions.filter(template =>
  template.title.toLowerCase().startsWith(editTitle.toLowerCase())
);
  useEffect(() => {
    setEditTitle(node.title);
  }, [node.title]);

  useEffect(() => {
    if (focusedId === node.id && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [focusedId, node.id]);

  const handleTextChange = (text: string) => {
    setEditTitle(text);
    // console.log('test', suggestions);
    setShowSuggestions(filteredSuggestions.length > 0); // Show suggestions only when there's text
  };
const handleSuggestionSelect = (suggestion: TaskTemplate) => {
  console.log('suggestion:', suggestion);
  setEditTitle(suggestion.title);
  setShowSuggestions(false);
};

  const handleSubmit = async () => {
    await onUpdateTitle(node.id, editTitle);
    await onAddItemAfter("", node.id);
    setShowSuggestions(false);
  };
  const handleBlur = () => {

    // setTimeout(() => setShowSuggestions(false), 500);
    onUpdateTitle(node.id, editTitle);
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.expand}>
          <Text>{hasChildren ? (expanded ? "▼" : "▶") : " "}</Text>
        </Pressable>

        {showCompletionToggle && onToggleCompletion && (
          <Switch
            value={'completed' in node ? (node as TaskNode).completed===1 : false}
            onValueChange={async () => await onToggleCompletion(node.id)}
          />
        )}

        <TextInput
          ref={textInputRef}
          style={styles.input}
          autoFocus={focusedId === node.id}
          value={editTitle}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmit}
          onBlur={handleBlur}
          returnKeyType="done"
        />

        {showSuggestions && filteredSuggestions.length > 0 && parentId &&(
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={filteredSuggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <Text style={styles.suggestionText}>{item.title}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
            />
          </View>
        )}
        <Pressable onPress={() => onAddSubItem("", node.id)} style={styles.iconButton}>
          <Text style={styles.icon}>+</Text>
        </Pressable>

        <Pressable onPress={() => onDelete(node.id)} style={styles.iconButton}>
          <Text style={styles.icon}>x</Text>
        </Pressable>
      </View>

      {expanded && hasChildren && (
        <View style={[styles.children, {paddingLeft: 20 + (level * 20)}]}>
          {node.children?.map(child => (
            <BaseItem
              key={child.id}
              node={child}
              showCompletionToggle={showCompletionToggle}
              onToggleCompletion={onToggleCompletion}
              onDelete={onDelete}
              onAddSubItem={onAddSubItem}
              onAddItemAfter={onAddItemAfter}
              onUpdateTitle={onUpdateTitle}
              focusedId={focusedId}
              level={level + 1}
              suggestions={suggestions}
              parentId={node.id}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {marginBottom: 6},
  row: {flexDirection: "row", alignItems: "center"},
  expand: {width: 24, alignItems: "center"},
  input: {flex: 1, padding: 8, borderWidth: 1, borderColor: "#ddd", borderRadius: 6, marginHorizontal: 8},
  iconButton: {padding: 6, marginLeft: 6, backgroundColor: "#eee", borderRadius: 6},
  icon: {fontSize: 18, fontWeight: "600"},
  children: {marginTop: 6},
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5, // for Android shadow
    shadowColor: '#000', // for iOS shadow
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
