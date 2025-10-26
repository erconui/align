import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

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
  level = 0
}: BaseItemProps<T>) => {
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setEditTitle(node.title);
  }, [node.title]);

  useEffect(() => {
    if (focusedId === node.id && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [focusedId, node.id]);

  const handleSubmit = async () => {
    await onUpdateTitle(node.id, editTitle);
    await onAddItemAfter("", node.id);
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
            value={'completed' in node ? (node as TaskNode).completed : false}
            onValueChange={async () => await onToggleCompletion(node.id)}
          />
        )}

        <TextInput
          ref={textInputRef}
          style={styles.input}
          autoFocus={focusedId === node.id}
          value={editTitle}
          onChangeText={setEditTitle}
          onSubmitEditing={handleSubmit}
          onBlur={() => onUpdateTitle(node.id, editTitle)}
          returnKeyType="done"
        />

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
});
