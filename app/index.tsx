import TaskDetail from '@/src/components/TaskDetail';
import { TaskInstance } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Text,
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
    suggestions,
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
    moveTask,
    setTaskView,
    taskViewId,
    gestures,
    updateTask
  } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [suggestionsPosition, setSuggestionsPosition] = useState<{ x: number; y: number; width: number } | null>(null);
  const [suggestionsItemId, setSuggestionsItemId] = useState<string | null>(null);
  const [suggestionsParentId, setSuggestionsParentId] = useState<string | null>(null);
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [containerLayout, setContainerLayout] = useState<{y: number}>({y: 0});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [extraData, setExtraData] = useState(false);
  const [detailItem, setDetailItem] = useState<TaskInstance | null>(null);

  useEffect(() => {
    setSuggestionsVisible(false);
    setExtraData(prev => !prev);
    // scrollToFocusedItem();
  }, [focusedId]);
  useEffect(() => {
    if (showCompleted) {
      setTimeout(() => {
        setShowCompleted(false);
      }, 10*1000);
    }
  }, [showCompleted]);
  useEffect(() => {
    if (!keyboardHeight) {
      setTimeout(() => {
        setSuggestionsVisible(false);
      }, 800);
    }
  }, [keyboardHeight]);
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
  const { colors, styles } = useTheme();
  const itemRefs = useRef<Record<string, View | null>>({});



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

  const openDetailView = (itemId: string) => {
    const task = flatTasks.find(t => t.id === itemId);
    if (task) {
      setDetailItem(task);
    }
  }

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
      // console.log(finalPosition.y, finalPosition.x, Math.abs(finalPosition.y) < ITEM_HEIGHT, finalPosition.x > INDENTATION_WIDTH*10)
      if (Math.abs(finalPosition.y) < ITEM_HEIGHT && finalPosition.x >= INDENTATION_WIDTH*10) {
        createTemplateFromTask(itemId);
        return;
      }
      if (Math.abs(finalPosition.y) < ITEM_HEIGHT && finalPosition.x < -1*INDENTATION_WIDTH*10) {
        deleteTask(itemId);
        return;
      }

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
      // console.log(dropY, lowestY - 2*dragged.height/3, lowestY+2*dragged.height/3);
      if (!targetEntry) {
        if (dropY < lowestY - 2*dragged.height) {
          setTaskView(itemId);
        } else if (dropY < lowestY + 2*dragged.height/3) {
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
  const scrollToFocusedItem = () => {
    if (!focusedId || !flatListRef.current) return;
    
    // Find the index of the focused item in your data array
    const dataToUse = showCompleted ? tasks : remainingTasks;
    const focusedIndex = dataToUse.findIndex(item => item.id === focusedId);
    
    if (focusedIndex !== -1) {
      // Scroll to the focused item with a small delay to ensure it's rendered
      setTimeout(() => {
        if (flatListRef){
          flatListRef.current?.scrollToIndex({
            index: focusedIndex,
            animated: true,
            viewPosition: 0.5, // Center the item in the view
            viewOffset: 50, // Add some offset from top/bottom
          });
        }
        }, 100);
      }
  };
  const remainingTasks = tasks.filter(t => !t.completed || isWithinTime(t.completed_at, {minutes:0}) );
  const remainingSubTasks = flatTasks.filter(t => !t.completed && remainingTasks.some(task => task.id == t.parent_id)).length;
  const num_completed = tasks.length - tasks.filter(t=> !t.completed).length;
  const num_tasks_remaining = tasks.length - num_completed;
  const getTitle = () => {
    if (taskViewId) {
        return (<Text style={{ color: colors.muted, marginTop: 4 }}> {taskViewId?flatTasks.find(t=>t.id===taskViewId)?.title:null}
        </Text>);
    } 
  };
  const title = taskViewId?flatTasks.find(t=>t.id===taskViewId)?.title:null;


  return (
      <View style={{ flex: 1, backgroundColor: colors.background }} >
        {/* Header */}
        <View style={{...styles.header, marginBottom:10, flexDirection:'row', alignItems:'center'}}>
          {taskViewId? <View style={{flexDirection: 'row', justifyContent:'center'}}>
            <Pressable onPress={() => {setTaskView(null); Keyboard.dismiss()}} style={{justifyContent:'center'}}>
              <Ionicons name="chevron-back" size={24} style={{...styles.headerText, marginBottom: 0, color: colors.buttonBorder, fontSize: 36}} /></Pressable>
            <Text style={{...styles.headerText, marginBottom: 0}}>{title}:  </Text></View>
            :null}
          <View style={{flex: 1,alignItems:'center'}}>
          <Text style={{ color: colors.muted, paddingBottom: 10 }}>
            {num_tasks_remaining} {num_tasks_remaining === 1 ? 'task' : 'tasks'} and {remainingSubTasks} {remainingSubTasks === 1 ? 'subtask' : 'subtasks'} remaining
          </Text>
          <ProgressBar value={percentage}
            progressColor={colors.highlight}
            backgroundColor={colors.button}
            textColor={percentage > 45 ? colors.text : colors.muted}
            rounded
            showPercent /></View>
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
        {/* Detail View Modal */}
        <TaskDetail task={detailItem} onSave={updateTask} onClose={() => setDetailItem(null)}
        />
        <View className="flex-1" onLayout={handleContainerLayout}
            style={{marginBottom:containerLayout.y + keyboardHeight}}>
          <FlatList
            ref={flatListRef}
            keyboardShouldPersistTaps='handled'
            data={showCompleted?tasks:remainingTasks}
                removeClippedSubviews={false}
                // extraData={extraData} -- this doesn't work
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
                minimalistView={gestures}
                toggleExpand={async (parentId, id) => {
                  toggleTaskExpand(id);
                }}
                onInputMeasure={handleInputMeasure}
                onTextChange={handleTextChange}
                generateList={createTemplateFromTask}
                closeSuggestions={closeSuggestions}
                registerRefs={registerRefs}
                handleDrop={handleDrop}
                openDetailView={openDetailView}
              />
            )} />
            {!showCompleted && (tasks.length-remainingTasks.length>0)?
              <Pressable onPress={() => {setShowCompleted(true); Keyboard.dismiss()}} style={{...styles.row}}>
                <Text style={{...styles.input,backgroundColor: colors.progressBackground, textAlign: 'center'}}>Show {tasks.length-remainingTasks.length} tasks completed</Text>
                </Pressable>:null}
        </View>
      </View>
  );
}
