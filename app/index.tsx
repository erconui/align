import { Dropdown } from '@/src/components/Dropdown';
import TaskDetail from '@/src/components/TaskDetail';
import { Mode, TaskInstance, TaskNode, modes } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Switch,
  Text,
  View
} from 'react-native';
import { ProgressBar } from 'rn-inkpad';
import { GlobalSuggestions } from '../src/components/GlobalSuggestions';
import { TaskItem } from '../src/components/TaskItem';
import TaskSettings from '../src/components/TaskSettings';
import { useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

const ITEM_HEIGHT = 40;
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
    updateTask,
    mode,
    setMode,
    publicView,
    updatePrivacy,
    num_tasks_remaining
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
  const drawerRef = useRef<{ open: () => void; close: () => void } | null>(null);
  const [itemHeights, setItemHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    setSuggestionsVisible(false);
    setExtraData(prev => !prev);
    // scrollToFocusedItem();
  }, [focusedId]);
  useEffect(() => {
    // Force re-render when showCompleted changes
    setExtraData(prev => !prev);
    if (showCompleted) {
      setTimeout(() => {
        setShowCompleted(false);
      }, 60*1000);
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

  const handleInputMeasure = (position: { x: number; y: number; width: number, height: number }, itemId: string, parentId: string | null) => {
    setSuggestionsPosition(position);
    setSuggestionsItemId(itemId);
    setSuggestionsParentId(parentId || null);
    setItemHeights(h => ({ ...h, [itemId]: position.height }));
    // setSuggestionsVisible(true);
  };

  const handleTextChange = (text: string) => {
    // console.log('handle text change', text);
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
    let currentY = containerLayout.y;
    const HEADER_HEIGHT = 37.33; // Approximate header height

    const traverse = (node: TaskNode, depth: number = 0) => {
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
        node.children.forEach(child => {
          traverse(child, depth + 1);
        });
      }
    };

    // Traverse through DateTask array - headers and tasks both affect Y position
    tasks.forEach(item => {
      if (item.type === 'header') {
        // Headers take up space too
        currentY += HEADER_HEIGHT;
      } else if (item.type === 'task') {
        const taskNode = item.data as TaskNode;
        // Only calculate positions for root-level tasks (matching taskViewId filter)
        if ((taskNode.parent_id === taskViewId) || (!taskNode.parent_id && !taskViewId)) {
          traverse(taskNode, 0);
        }
      }
    });
    
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

  const title = taskViewId?flatTasks.find(t=>t.id===taskViewId)?.title:null;

  const filtered = showCompleted?tasks:tasks.filter(node => {
    if (node.type === 'task') {
      return !(node.data as TaskNode).completed || isWithinTime((node.data as TaskNode).completed_at, {minutes:0});
    } else {
      return false;
    }
  });
  const modeOptions = modes.map(m => ({
    label: m.charAt(0).toUpperCase() + m.slice(1),
    value: m,
  }));

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
              {num_tasks_remaining[0]} {num_tasks_remaining[0] === 1 ? 'task' : 'tasks'} and {num_tasks_remaining[1]}{num_tasks_remaining[1] === 1 ? 'subtask' : 'subtasks'} remaining
            </Text>
            <ProgressBar value={percentage}
              progressColor={colors.highlight}
              backgroundColor={colors.button}
              textColor={percentage > 45 ? colors.text : colors.muted}
              rounded
              showPercent />
          </View>
          <Pressable onPress={() => { drawerRef.current?.open?.(); Keyboard.dismiss(); }} style={{justifyContent:'center'}}>
            <Ionicons name="ellipsis-horizontal-outline" size={24} style={{...styles.headerText, marginBottom: 0, color: colors.buttonBorder, fontSize: 24, paddingBottom:20, paddingLeft:20}} />
          </Pressable>
        </View>

        <TaskSettings ref={drawerRef}>
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={styles.headerText}>Settings</Text>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <Text style={styles.settingText}>Show completed tasks</Text>
              <Switch value={showCompleted} onValueChange={setShowCompleted} />
            </View>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <Text style={styles.settingText}>Show private</Text>
              <Switch value={!publicView} onValueChange={(value) => updatePrivacy(!value)} />
            </View>

            <Dropdown
              value={mode}
              onChange={(m: Mode) => setMode(m)}
              options={modes}
            />
          </View>
        </TaskSettings>

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
            data={filtered}
            removeClippedSubviews={false}
            extraData={extraData}
            keyExtractor={(item, index) => {
              if (item.type === 'header') {
                return `header-${item.data}`;
              } else {
                return (item.data as TaskNode).id;
              }
            }}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                // Render date header
                const dateStr = item.data as string;
                
                // Handle "No due date" header
                if (dateStr === 'No due date') {
                  return (
                    <View style={{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: colors.button }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                        No due date
                      </Text>
                    </View>
                  );
                }
                
                // Try to parse as date
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                  // Invalid date, just show the string
                  return (
                    <View style={{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: colors.button }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                        {dateStr}
                      </Text>
                    </View>
                  );
                }
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const dateOnly = new Date(date);
                dateOnly.setHours(0, 0, 0, 0);
                
                let dateLabel = dateStr;
                if (dateOnly.getTime() === today.getTime()) {
                  dateLabel = 'Today';
                } else if (dateOnly.getTime() === tomorrow.getTime()) {
                  dateLabel = 'Tomorrow';
                } else if (dateOnly.getTime() === yesterday.getTime()) {
                  dateLabel = 'Yesterday';
                } else {
                  dateLabel = date.toLocaleDateString(undefined, { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                }
                
                return (
                  <View style={{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: colors.button }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                      {dateLabel}
                    </Text>
                  </View>
                );
              } else {
                // Render task
                const taskNode = item.data as TaskNode;
                return (
                  <TaskItem
                    key={taskNode.id}
                    taskNode={taskNode}
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
                    showCompletedAll={showCompleted}
                  />
                );
              }
            }} />
        </View>
      </View>
  );
}
