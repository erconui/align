export interface TaskTemplate {
  id: string;
  title: string;
  is_complex: boolean;
  // created_at: string;
  // updated_at: string;
}

export interface TaskInstance {
  id: string;
  template_id: string | null;
  parent_instance_id: string | null;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  recurrence_rule: string | null;
  completed_at: string | null;
  sort_order: number;
}

export interface TaskTemplateRelation {
  id: string;
  parent_template_id: string;
  child_template_id: string;
  sort_order: number;
}