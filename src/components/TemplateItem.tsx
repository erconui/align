import React from 'react';
import { useTaskStore } from '../stores/taskStore';
import { BaseItem, TaskTemplate } from './BaseItem';

interface TemplateNode {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  children?: TemplateNode[];
}

interface TemplateItemProps {
  templateNode: TemplateNode;
  expandedTemplates: Set<string>;
  onToggleExpand: (id: string) => void;
  onUseTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  addTemplateAfter: (title: string, afterId: string) => void;
  updateTemplate: (id: string, title: string) => void;
  replaceTemplate: (parentId: string | null, oldId: string, newId: string) => void;
  removeTemplate: (parentId: string | null, id: string) => void;
  generateList: (id: string) => void;
  focusedId: string | null;
  suggestions: TaskTemplate[];
  parentId: string | null;
  onInputMeasure?: (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => void;
  onTextChange?: (text: string) => void;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
                                                            templateNode,
                                                            expandedTemplates,
                                                            onToggleExpand,
                                                            onUseTemplate,
                                                            deleteTemplate,
                                                            addTemplateAfter,
                                                            updateTemplate,
  replaceTemplate,
                                                            focusedId,
  suggestions,
  parentId,
  removeTemplate,
  onInputMeasure,
  onTextChange,
  generateList
                                                          }) => {
  const {createTemplate} = useTaskStore();

  return (
    <BaseItem
      node={templateNode}
      showCompletionToggle={false}
      onDelete={async (parentId, id) => {
        removeTemplate(parentId, id);
      }}
      onAddSubItem={async (title, parentId) => {
        if (parentId) {
          await createTemplate(title, parentId);
        }
      }}
      onAddItemAfter={(title, afterId) => {
        if (afterId) {
          addTemplateAfter(title, afterId);
        }
      }}
      replaceTemplate={replaceTemplate}
      onUpdateTitle={updateTemplate}
      focusedId={focusedId}
      suggestions={suggestions}
      parentId={parentId}
      isTask={false}
      onInputMeasure={onInputMeasure}
      onTextChange={onTextChange}
      generateList={generateList}
    />
  );
};