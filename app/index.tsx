import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ProgressBar } from 'rn-inkpad';
import { GlobalSuggestions } from '../src/components/GlobalSuggestions';
import { TaskItem } from '../src/components/TaskItem';
import { useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

const ITEM_HEIGHT = 37.33;
const INDENTATION_WIDTH = 20;

export default function HomeScreen() {
  const {
    tree,
    focusedId,
    tasks,
    flatTasks,
    isLoading,
    error,
    addSubTask,
    addTaskAfter,
    toggleTask,
    toggleTaskExpand,
    deleteTask,
    updateTaskTitle,
    replaceTaskWithTemplate,
    createTemplateFromTask,
    percentage,
    moveTask
  } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestionsPosition, setSuggestionsPosition] = useState<{ x: number; y: number; width: number } | null>(null);
  const [suggestionsItemId, setSuggestionsItemId] = useState<string | null>(null);
  const [suggestionsParentId, setSuggestionsParentId] = useState<string | null>(null);
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [containerLayout, setContainerLayout] = useState<{y: number}>({y: 0});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    setSuggestionsVisible(false);
  }, [focusedId]);

  const suggestions = useMemo(() => {
    return tree.map(node => ({
      id: node.id,
      title: node.title,
    }));
  }, [tree]);
  const { colors, styles } = useTheme();
  const itemRefs = useRef<Record<string, View | null>>({});

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height-40);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    // Cleanup function
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);


  useEffect(() => {
    if (!keyboardHeight) {
      setTimeout(() => {
        setSuggestionsVisible(false);
      }, 800);
    }
  }, [keyboardHeight]);
  const handleAddTask = () => {
    // if (newTaskTitle.trim()) {
      addSubTask(newTaskTitle.trim(), null);
      setNewTaskTitle('');
    // }
  };

  const handleInputMeasure = (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => {
    setSuggestionsPosition(position);
    setSuggestionsItemId(itemId);
    setSuggestionsParentId(parentId || null);
    setSuggestionsVisible(true);
  };

  const handleTextChange = (text: string) => {
    setCurrentSearchText(text);
    setSuggestionsVisible(text.length > 0);
  };

  const closeSuggestions = () => {
    setTimeout(() => {
      setSuggestionsVisible(false);
    }, 200);
  };

  const handleSuggestionSelect = async (suggestion: { id: string; title: string }, itemId: string, parentId: string | null) => {
    await replaceTaskWithTemplate(itemId, suggestion.id);
    setSuggestionsVisible(false);
    setCurrentSearchText('');
    setSuggestionsItemId(null);
    setSuggestionsParentId(null);
  };

  const registerItemLayout = (itemId: string, layout: {x:number; y:number; width:number; height:number}) => {
  };
  const registerRefs = (itemId: string, ref: View | null) => {
    itemRefs.current[itemId] = ref;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ fontSize: 18, color: '#6B7280', marginTop: 16 }}>Loading tasks...</Text>
      </View>
    );
  }
  // Measure only the list container once
  const handleContainerLayout = (event: any) => {
    const layout = event.nativeEvent.layout;
    setContainerLayout(layout);
  };
  // Core function: Calculate all positions from tree data
  const calculateTreePositions = () => {
    const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
    let currentY = containerLayout.y;// + HEADER_HEIGHT;

    const traverse = (nodes: any[], depth: number = 0) => {
      nodes.forEach(node => {
        // Calculate position for this node
        positions[node.id] = {
          x: depth * INDENTATION_WIDTH,
          y: currentY,
          width: 400 - (depth * INDENTATION_WIDTH), // Adjust based on your screen
          height: ITEM_HEIGHT
        };
        
        currentY += ITEM_HEIGHT;
        
        // Recursively traverse children if expanded
        if (node.expanded && node.children && node.children.length > 0) {
          traverse(node.children, depth + 1);
        }
      });
    };

    // Start with root nodes (no parentId)
    traverse(tasks);
    
    return positions;
  };
  const handleDrop = (itemId: string, finalPosition: { x: number; y: number }) => {
    requestAnimationFrame(() => {
      const layouts = calculateTreePositions();
      const dragged = layouts[itemId];
      if (!dragged) return;

      // Compute final drop position
      const dropY = dragged.y + finalPosition.y;
      const dropCenterY = dropY + dragged.height / 2;
      const dropX = dragged.x + finalPosition.x;

      // Find potential drop target
      const entries = Object.entries(layouts)//.filter(([id]) => id !== itemId);
      entries.find(([_WORKLET_RUNTIME, {x}]) => dropX )
      const targetEntry = entries.find(([_, { y, height }]) => dropCenterY > y && dropCenterY < y + height);
      const lowestY = Object.values(layouts).length > 0 
        ? Math.min(...Object.values(layouts).map(layout => layout.y))
        : 0;
      if (!targetEntry) {
        if (dropY < lowestY + 2*dragged.height/3) {
          moveTask(itemId, null, 0); // move it to the top of the list
        } else {
          console.log('No valid drop target found.', dropY, lowestY, lowestY + dragged.height/2);
        }
        return;
      };
      const [targetId, targetLayout] = targetEntry;
      const xshift = dropX - targetLayout.x;
      if (xshift >= INDENTATION_WIDTH*2) {
        moveTask(itemId, targetId, 1);
      } else if (xshift >= -2*INDENTATION_WIDTH/3) {
        moveTask(itemId, targetId, 0);
      } else {
        moveTask(itemId, targetId, Math.round(xshift/INDENTATION_WIDTH));
      }
    });
  };

  const remainingTasks = tasks.filter(t => !t.completed);
  const remainingSubTasks = flatTasks.filter(t => !t.completed && remainingTasks.some(task => task.id == t.parent_id)).length;


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} >
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {remainingTasks.length} {remainingTasks.length === 1 ? 'task' : 'tasks'} and {remainingSubTasks} {remainingSubTasks === 1 ? 'subtask' : 'subtasks'} remaining
        </Text>
        <ProgressBar value={percentage}
          progressColor={colors.highlight}
          backgroundColor={colors.button}
          textColor={percentage > 45 ? colors.text : colors.muted}
          rounded
          showPercent />
      </View>

      {/* Global Suggestions */}
      <GlobalSuggestions
        suggestions={suggestions}
        position={suggestionsPosition}
        visible={suggestionsVisible}
        keyboardHeight={keyboardHeight}
        searchText={currentSearchText}
        onSuggestionSelect={(suggestion) => {
          if (suggestionsItemId) {
            handleSuggestionSelect(suggestion, suggestionsItemId, suggestionsParentId);
          }
        }}
      />

      {/* Add Task Form */}
      <View style={{ padding: 16, backgroundColor: colors.background, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Add a new task..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={handleAddTask}
            style={{ ...styles.input, flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: 16, marginHorizontal: 0 }}
          />
          <TouchableOpacity
            onPress={handleAddTask}
            // disabled={!newTaskTitle.trim()}
            style={{ ...styles.pressableButton, borderTopRightRadius: 8, borderBottomRightRadius: 8 }}
          >
            <Ionicons name="add" size={20} color={colors.tint} paddingVertical={styles.pressableButton.paddingVertical} />
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={{ color: '#ef4444', marginTop: 8, fontSize: 12 }}>{error}</Text>
        )}
      </View>
      <View className="flex-1" onLayout={handleContainerLayout}>
        <FlatList
          data={tasks}
          style={{marginBottom:containerLayout.y + keyboardHeight}}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskItem
              key={item.id}
              taskNode={item}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              addSubTask={addSubTask}
              addTaskAfter={addTaskAfter}
              updateTaskTitle={updateTaskTitle}
              focusedId={focusedId}
              toggleExpand={async (parentId, id) => {
                toggleTaskExpand(id);
              }}
              onInputMeasure={handleInputMeasure}
              onTextChange={handleTextChange}
              generateList={createTemplateFromTask}
              closeSuggestions={closeSuggestions}
              registerRefs={registerRefs}
              handleDrop={handleDrop}
            />
          )} />
      </View>
    </View>
  );
}
