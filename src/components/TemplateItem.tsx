import React from 'react';
import { useTaskStore } from '../stores/taskStore';
import { BaseItem } from './BaseItem';

interface TemplateNode {
  id: string;
  title: string;
  children?: TemplateNode[];
  created_at?: string;
}

interface TemplateItemProps {
  templateNode: TemplateNode;
  expandedTemplates: Set<string>;
  onToggleExpand: (id: string) => void;
  onUseTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  addTemplateAfter: (title: string, afterId: string) => void;
  updateTemplate: (id: string, title: string) => void;
  level: number;
  focusedId: string | null;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
                                                            templateNode,
                                                            expandedTemplates,
                                                            onToggleExpand,
                                                            onUseTemplate,
                                                            deleteTemplate,
                                                            addTemplateAfter,
                                                            updateTemplate,
                                                            level,
                                                            focusedId
                                                          }) => {
  const {createTemplate} = useTaskStore();

  return (
    <BaseItem
      node={templateNode}
      showCompletionToggle={false}
      onDelete={deleteTemplate}
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
      onUpdateTitle={updateTemplate}
      focusedId={focusedId}
      level={level}
    />
  );
};