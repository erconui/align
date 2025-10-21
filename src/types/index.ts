export interface TaskTemplate {
  id: string;
  title: string;
}

export interface TaskInstance {
  id: string;
  template_id: string | null;
  parent_id: string | null;
  title: string;
  completed: boolean;
  sort_order: number;
}

export interface TaskTemplateRelation {
  id: string;
  parent_template_id: string;
  child_template_id: string;
  sort_order: number;
}