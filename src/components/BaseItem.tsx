import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useTheme } from '../hooks/useTheme';
import { DraggableContext } from './DraggableContext';

interface BaseNode {
  id: string;
  title: string;
  expanded?: boolean;
  children?: BaseNode[];
}

interface TaskNode extends BaseNode {
  completed: boolean;
}

interface BaseItemProps<T extends BaseNode> {
  node: T;
  showCompletionToggle?: boolean;
  onToggleCompletion?: (id: string) => void;
  onDelete: (parentId: string | null, id: string) => void;
  onAddSubItem: (title: string, parentId: string | null) => void;
  onAddItemAfter: (title: string, afterId: string | null) => void;
  generateList: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  toggleExpand: (parentId: string | null, id: string) => void;
  focusedId: string | null;
  level?: number;
  parentId?: string | null;
  isTask: boolean;
  onInputMeasure?: (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => void;
  onTextChange?: (text: string) => void;
  closeSuggestions: () => void;
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
                                               parentId,
                                               isTask,
                                               onInputMeasure,
                                               onTextChange,
                                               generateList,
                                               toggleExpand,
                                               closeSuggestions
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

  const handleTextChange = (text: string) => {
    setEditTitle(text);
    if (onTextChange) {
      onTextChange(text);
    }
    if (text.length > 0 && onInputMeasure && textInputRef.current) {
      textInputRef.current.measure((x, y, width, height, pageX, pageY) => {
        onInputMeasure({ x: pageX, y: pageY + height, width }, node.id, parentId || null);
      });
    }
  };

  const handleSubmit = async () => {
    await onUpdateTitle(node.id, editTitle);
    await onAddItemAfter("", node.id);
    closeSuggestions
  };

  const handleBlur = () => {
    onUpdateTitle(node.id, editTitle);
    closeSuggestions();
  };

  const hasChildren = node.children && node.children.length > 0;
  const { colors, styles } = useTheme();

  return (
    <View style={[{backgroundColor: colors.background}]}> 
      <DraggableContext
        itemId={node.id}
        onDragStart={() => {
          // Handle drag start - you might want to highlight or show drop zones
          console.log('Drag started for:', node.id);
        }}
        onDragEnd={() => {
          // Handle drag end - check if dropped on valid target
          console.log('Drag ended for:', node.id);
        }}>
        <View style={styles.row}>
          {hasChildren?<Pressable onPress={() => toggleExpand(parentId||null,node.id)} style={styles.expand}>
            {node.expanded ? <Ionicons name="caret-down-outline" size={18} color={colors.icon} style={styles.icon} /> :
                        <Ionicons name="caret-forward-outline" size={18} color={colors.icon} style={styles.icon} />}
          </Pressable>:<View style={styles.expand} />}

          {showCompletionToggle && onToggleCompletion && (
            <View style={styles.checkboxContainer}>
              <BouncyCheckbox
                isChecked={'completed' in node ? (node as TaskNode).completed : false}
                useBuiltInState={false}
                onPress={async () => await onToggleCompletion(node.id)}
                fillColor={colors.highlight}
              />
            </View>
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

          <Pressable onPress={() => hasChildren?generateList(node.id):onAddSubItem("", node.id)} >
            <Ionicons name={hasChildren?isTask?"list-outline":"checkbox-outline":"add-outline"} size={18} style={{...styles.iconButton}}/>
          </Pressable>

          <Pressable onPress={() => onDelete(parentId || null, node.id)} >
            <Ionicons name="trash-outline" size={18} color={colors.icon} style={{...styles.iconButton}}/>
          </Pressable>
        </View>
      </DraggableContext>
      {node.expanded && hasChildren && (
        <View style={[{paddingLeft: 20 + (level * 20)}]}>
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
              parentId={node.id}
              isTask={isTask}
              onInputMeasure={onInputMeasure}
              onTextChange={onTextChange}
              generateList={generateList}
              toggleExpand={toggleExpand}
              closeSuggestions={closeSuggestions}
            />
          ))}
        </View>
      )}
    </View>
  );
};
