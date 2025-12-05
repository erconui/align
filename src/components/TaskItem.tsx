import React from 'react';
import { View } from 'react-native';
import { TaskNode } from '../types/index';
import { BaseItem } from './BaseItem';

interface TaskItemProps {
  taskNode: TaskNode;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  generateList: (taskId: string) => void;
  addSubTask: (title: string, parentId: string | null) => void;
  addTaskAfter: (title: string, afterId: string | null) => void;
  updateTaskTitle: (id: string, title: string) => void;
  focusedId: string | null;
  onInputMeasure?: (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => void;
  onTextChange?: (text: string) => void;
  toggleExpand: (parentId: string | null, id: string) => void;
  closeSuggestions: () => void;
  registerRefs: (itemId: string, ref: View | null) => void;
  handleDrop: (itemId: string, finalPosition: { x: number; y: number }) => void;
  openDetailView: (itemId: string) => void;
  minimalistView: boolean;
  showCompletedAll: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
                                                   taskNode,
                                                   toggleTask,
                                                   deleteTask,
                                                   addSubTask,
                                                   addTaskAfter,
                                                   updateTaskTitle,
                                                   focusedId,
                                                   onInputMeasure,
                                                   onTextChange,
                                                   generateList,
                                                   toggleExpand,
                                                   closeSuggestions,
                                                   registerRefs,
                                                   handleDrop,
                                                   minimalistView,
                                                   openDetailView,
                                                   showCompletedAll
                                                  }) => {
  return (
    <BaseItem
      node={taskNode}
      showCompletionToggle={true}
      onToggleCompletion={toggleTask}
      onDelete={async (parentId, id) => {
        deleteTask(id);
      }}
      onAddSubItem={addSubTask}
      onAddItemAfter={addTaskAfter}
      onUpdateTitle={updateTaskTitle}
      focusedId={focusedId}
      isTask={true}
      onInputMeasure={onInputMeasure}
      onTextChange={onTextChange}
      generateList={generateList}
      toggleExpand={toggleExpand}
      closeSuggestions={closeSuggestions}
      registerRefs={registerRefs}
      handleDrop={handleDrop}
      minimalistView={minimalistView}
      openDetailView={openDetailView}
      showCompletedAll={showCompletedAll}
    />
  );
};