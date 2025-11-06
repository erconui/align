import React from 'react';
import { TaskNode } from '../stores/taskStore';
import { BaseItem, TaskTemplate } from './BaseItem';

interface TaskItemProps {
  taskNode: TaskNode;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addSubTask: (title: string, parentId: string | null) => void;
  addTaskAfter: (title: string, afterId: string | null) => void;
  updateTaskTitle: (id: string, title: string) => void;
  replaceTemplate: (parentId: string | null, oldId: string, newId: string) => void;
  focusedId: string | null;
  suggestions: TaskTemplate[];
  onInputMeasure?: (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => void;
  onTextChange?: (text: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
                                                    taskNode,
                                                    toggleTask,
                                                    deleteTask,
                                                    addSubTask,
                                                    addTaskAfter,
                                                    updateTaskTitle,
  replaceTemplate,
                                                    focusedId,
  suggestions,
  onInputMeasure,
  onTextChange
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
      suggestions={suggestions}
      replaceTemplate={replaceTemplate}
      isTask={true}
      onInputMeasure={onInputMeasure}
      onTextChange={onTextChange}
    />
  );
};