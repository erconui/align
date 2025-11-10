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
  removeTemplate: (parentId: string | null, id: string) => void;
  toggleExpand: (parentId: string | null, id: string) => void;
  generateList: (id: string) => void;
  focusedId: string | null;
  parentId: string | null;
  onInputMeasure?: (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => void;
  onTextChange?: (text: string) => void;
  closeSuggestions: () => void;
  handleDrop: (itemId: string, finalPosition: { x: number; y: number }) => void;
  registerItemLayout: (itemId: string, layout: { x: number; y: number; width: number; height: number }) => void;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
                                                           templateNode,
                                                           expandedTemplates,
                                                           onToggleExpand,
                                                           onUseTemplate,
                                                           deleteTemplate,
                                                           addTemplateAfter,
                                                           updateTemplate,
                                                           focusedId,
                                                           parentId,
                                                           removeTemplate,
                                                           onInputMeasure,
                                                           onTextChange,
                                                           generateList,
                                                           toggleExpand,
                                                           closeSuggestions,
                                                           registerItemLayout,
                                                           handleDrop
                                                          }) => {
  const { createTemplate } = useTaskStore();

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
      onUpdateTitle={updateTemplate}
      focusedId={focusedId}
      parentId={parentId}
      isTask={false}
      onInputMeasure={onInputMeasure}
      onTextChange={onTextChange}
      generateList={generateList}
      toggleExpand={toggleExpand}
      closeSuggestions={closeSuggestions}
      handleDrop={handleDrop}
      registerItemLayout={registerItemLayout}
    />
  );
};