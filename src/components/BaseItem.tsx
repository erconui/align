import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useTheme } from '../hooks/useTheme';
import { DraggableContext } from './DraggableContext';

interface BaseNode {
  id: string;
  title: string;
  expanded?: boolean;
  children?: BaseNode[];
  relId?: string;
}

interface TaskNode extends BaseNode {
  completed: boolean;
  completed_at: string | null;
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
  parentId?: string | null;
  isTask: boolean;
  onInputMeasure?: (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => void;
  onTextChange?: (text: string) => void;
  closeSuggestions: () => void;
  registerRefs: (itemId: string, ref: View | null) => void;
  handleDrop: (itemId: string, finalPosition: { x: number; y: number }) => void;
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
                                              parentId,
                                              isTask,
                                              onInputMeasure,
                                              onTextChange,
                                              generateList,
                                              toggleExpand,
                                              closeSuggestions,
                                              registerRefs,
                                              handleDrop
                                             }: BaseItemProps<T>) => {
  const [expanded, setExpanded] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const textInputRef = useRef<TextInput>(null);
  const itemRef = useRef<View>(null);

  useEffect(() => {
    setEditTitle(node.title);
  }, [node.title]);
  useEffect(() => {
    if (!node.expanded) {
      setShowCompleted(false);
    } else if (showCompleted) {
      setTimeout(() => {
        setShowCompleted(false);
      }, 30*1000);
    }
  }, [showCompleted, node.expanded]);

  useEffect(() => {
    if (focusedId === node.id && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [focusedId, node.id]);

  useEffect(() => {
    const id = isTask?node.id:node.relId!;
    if (id) {
      registerRefs(id, itemRef.current);
    }
  }, [node.id, itemRef.current, node.relId, isTask]);

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
  const isWithinTime = (dateString: string | null, days?:number, minutes?: number) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = Date.now();
    days = days?days:0;
    const hours  = days * 24;
    minutes = minutes?minutes:0 + hours * 60;
    const time_ms = minutes * 60 * 1000;
    console.log(days,hours,minutes,time_ms);
    console.log(now, date, time_ms, now-date.getTime()
  );

    return now - date.getTime() <= time_ms;
  };

  const handleBlur = () => {
    onUpdateTitle(node.id, editTitle);
    closeSuggestions();
  };
  const hasChildren = node.children && node.children.length > 0;
  const children = showCompleted?node.children: node.children?.filter(child => {
    if ('completed' in child) {
      return !isWithinTime((child as TaskNode).completed_at, 0, 5);
    } else {
      return true;
    }
  });
  const num_completed = hasChildren? node.children!.length - children!.length: 0;
  const { colors, styles } = useTheme();


  return (
    <View style={[{ backgroundColor: colors.background }]}>
      <DraggableContext
        itemId={node.relId?node.relId:node.id}
        onDrop={handleDrop}>
        <View style={styles.row} ref={itemRef}>
          {hasChildren ? 
          <Pressable onPress={() => toggleExpand(parentId || null, node.id)} style={styles.icon}>
            {node.expanded ? <Ionicons name="caret-down-outline" size={18} style={styles.icon} /> :
              <Ionicons name="caret-forward-outline" size={18} style={styles.icon} />}
          </Pressable> :
          <Pressable onPress={() => onAddSubItem("", node.id)} style={styles.icon} >
            <Ionicons name={"add-outline"} size={18} style={styles.icon} />
          </Pressable>}

          {showCompletionToggle && onToggleCompletion && (
            <View style={styles.checkboxContainer}>
              <BouncyCheckbox
                isChecked={'completed' in node ? (node as unknown as TaskNode).completed : false}
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
            multiline={true}
            returnKeyType="done"
            submitBehavior='submit'
          />
          {hasChildren? <Pressable onPress={() => generateList(node.id)} >
            <Ionicons name={isTask ? "list-outline" : "checkbox-outline"} size={18} style={{...styles.icon }} />
          </Pressable> : null}
{/* 
          <Pressable onPress={() => hasChildren ? generateList(node.id) : onAddSubItem("", node.id)} >
            <Ionicons name={hasChildren ? isTask ? "list-outline" : "checkbox-outline" : "add-outline"} size={18} style={{ ...styles.icon }} />
          </Pressable> */}

          <Pressable onPress={() => onDelete(parentId || null, node.id)} >
            <Ionicons name="trash-outline" size={18} color={colors.icon} style={{marginRight:10, ...styles.icon }} />
          </Pressable>
        </View>
      </DraggableContext>

      {node.expanded && hasChildren ? (
        <View style={[{ paddingLeft: 20 }]}>
          {children?.map(child => (
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
              parentId={node.id}
              isTask={isTask}
              onInputMeasure={onInputMeasure}
              onTextChange={onTextChange}
              generateList={generateList}
              toggleExpand={toggleExpand}
              closeSuggestions={closeSuggestions}
              registerRefs={registerRefs}
              handleDrop={handleDrop}
            />
          ))}
          {num_completed>0?
            <Pressable onPress={() => setShowCompleted(true)} style={{paddingLeft: 20+18+4+18+2, ...styles.row}}>
              <Text style={styles.input}>{num_completed} tasks completed</Text>
              </Pressable>:null}
        </View>
      ):null}
    </View>
  );
};
