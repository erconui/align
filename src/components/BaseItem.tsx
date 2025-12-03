import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useTheme } from '../hooks/useTheme';
import { TaskNode } from '../stores/taskStore';
import { DraggableContext } from './DraggableContext';

interface BaseNode {
  id: string;
  title: string;
  expanded?: boolean;
  children?: BaseNode[];
  relId?: string;
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
  minimalistView: boolean;
  openDetailView?: (id: string) => void;
}

export function BaseItem <T extends BaseNode>({
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
                                              handleDrop,
                                              minimalistView,
                                              openDetailView
                                             }: BaseItemProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const textInputRef = useRef<TextInput>(null);
  const itemRef = useRef<View>(null);

  useEffect(() => {
    setEditTitle(node.title);
  }, [node.title]);
  useEffect(() => {
    if (node.expanded && hasChildren && children?.length == 0) {
      setTimeout(() => {
        setShowCompleted(false);
        toggleExpand(parentId||null, node.id);
      }, 10*1000);
    }
    
    if (!node.expanded) {
      setShowCompleted(false);
    } else if (showCompleted) {
      setTimeout(() => {
        setShowCompleted(false);
      }, 10*1000);
    }
  }, [showCompleted, node.expanded]);
  useEffect(() => {
    if (focusedId === node.id && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [focusedId, node.id]);
  useEffect(() => {
    if (onInputMeasure && textInputRef.current) {
      textInputRef.current.measure((x, y, width, height, pageX, pageY) => {
        onInputMeasure({ x: pageX, y: pageY + height, width }, node.id, parentId || null);
      });
    }
    // if (isFocused && onTextChange) {
    //   onTextChange(node.title);
    // }
  }, [isFocused]);

  useEffect(() => {
    const id = isTask?node.id:node.relId!;
    if (id) {
      registerRefs(id, itemRef.current);
    }
  }, [node.id, itemRef.current, node.relId, isTask]);
  const { colors, styles } = useTheme();

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
  const isWithinTime = (dateString: string | null,
    { minutes = 0, hours = 0, days = 0 }: { minutes?: number; hours?: number; days?: number }) => {
    if (!dateString) return false;
    const date = new Date(dateString).getTime();
    const now = Date.now();
    const totalMs =
      minutes * 60_000 +
      hours * 3_600_000 +
      days * 86_400_000;

    return now - date <= totalMs;
  };

  const handleBlur = () => {
    onUpdateTitle(node.id, editTitle);
      setTimeout(() => {
        setIsFocused(textInputRef.current?.isFocused||false);
      }, 200);
    closeSuggestions();
  };
  const hasChildren = node.children && node.children.length > 0;
  const children = showCompleted?node.children: node.children?.filter(child => {
    if ('completed' in child) {
      return !(child as TaskNode).completed || isWithinTime((child as TaskNode).completed_at, {minutes:0});
    } else {
      return true;
    }
  });
  const num_completed = hasChildren? node.children!.length - children!.length: 0;


  return (
    <View style={[{ backgroundColor: colors.background }]}>
      <DraggableContext
        itemId={node.relId?node.relId:node.id}
        onDrop={handleDrop}>
        <View style={styles.row} ref={itemRef}>
          {hasChildren ? 
          <Pressable onPress={() => {toggleExpand(parentId || null, node.id); Keyboard.dismiss()}} style={styles.icon}>
            {node.expanded ? <Ionicons name="caret-down-outline" size={18} style={styles.icon} /> :
              <Ionicons name="caret-forward-outline" size={18} style={styles.icon} />}
          </Pressable> :
          <Pressable onPress={() => {onAddSubItem("", node.id); Keyboard.dismiss();}} style={styles.icon} >
            <Ionicons name={"add-outline"} size={18} style={styles.icon} />
          </Pressable>}


          {showCompletionToggle && onToggleCompletion && (
            <View style={styles.checkboxContainer}>
              <BouncyCheckbox
                isChecked={'completed' in node ? (node as unknown as TaskNode).completed : false}
                useBuiltInState={false}
                onPress={async () => {await onToggleCompletion(node.id); Keyboard.dismiss()}}
                fillColor={colors.highlight}
              />
            </View>
          )}
          {/* <Text style={styles.input} onPress={() => {
            setSelectedTask(node as unknown as TaskNode);}}>{editTitle}</Text> */}
            {/* <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}> */}
          <View style={{flex:1, flexDirection:'row', position:'relative', alignItems:'center'}}>
            <TextInput
              ref={textInputRef}
              style={[styles.input, isFocused&&{paddingRight:18}, minimalistView&&{marginRight: 10}]}
              placeholder='new task...'
              
              autoFocus={focusedId === node.id}
              value={editTitle}
              onChangeText={handleTextChange}
              onSubmitEditing={handleSubmit}
              onBlur={handleBlur}
              onFocus={() => setIsFocused(true)}
              multiline={true}
              returnKeyType="done"
              submitBehavior='submit'
            />

            {isFocused && openDetailView && (
            <Pressable onPress={() => openDetailView(node.relId?node.relId:node.id) } style={{...styles.icon, padding:0, position: 'absolute', right:12, }}>
              <Ionicons name="calendar-outline" size={24} style={{...styles.icon}}/>
            </Pressable>)}
          </View>

          {/* </TouchableWithoutFeedback> */}
          {!minimalistView?(hasChildren? <Pressable onPress={() => generateList(node.id)} >
            <Ionicons name={isTask ? "list-outline" : "checkbox-outline"} size={18} style={{...styles.icon }} />
          </Pressable> : null):null}

          {!minimalistView &&(
          <Pressable onPress={() => {onDelete(parentId || null, node.id); Keyboard.dismiss()}} >
            <Ionicons name="trash-outline" size={18} color={colors.icon} style={{marginRight:10, ...styles.icon }} />
          </Pressable>)}
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
              minimalistView={minimalistView}
              openDetailView={openDetailView}
            />
          ))}
          {num_completed>0?
            <Pressable onPress={() => setShowCompleted(true)} style={{paddingLeft: 20+18+4+18+2, ...styles.row}}>
              <Text style={{...styles.input,backgroundColor: colors.progressBackground}}>{num_completed} tasks completed. Show Completed Tasks</Text>
              </Pressable>:null}
        </View>
      ):null}
    </View>
  );
};
