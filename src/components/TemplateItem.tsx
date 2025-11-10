import React from 'react';
import { TemplateNode, useTaskStore } from '../stores/taskStore';
import { BaseItem } from './BaseItem';

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
  toggleExpand: (parentId: string | null, id: string) => void;
  generateList: (id: string) => void;
  focusedId: string | null;
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
  parentId,
  removeTemplate,
  onInputMeasure,
  onTextChange,
  generateList,
  toggleExpand
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
          await createTemplate(title, parentId, true);
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
      parentId={parentId}
      isTask={false}
      onInputMeasure={onInputMeasure}
      onTextChange={onTextChange}
      generateList={generateList}
      toggleExpand={toggleExpand}
    />
  );
};