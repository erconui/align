export interface TaskInstance {
  id: string;
  template_id: string | null;
  parent_id: string | null;
  title: string;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  recurrence_rule: string | null;
  position: number;
  expanded: boolean;
  private: boolean;
}

export interface TaskTemplate {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplateRelation {
  id: string;
  parent_id: string | null;
  child_id: string;
  position: number;
  expanded: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AddTaskParams {
  template_id?: string | null;
  parent_id?: string | null;
  title: string;
  completed: boolean;
  position?: number | null;
  after_id?: string | null;
}
export interface AddTemplateParams {
  template_id?: string | null;
  parent_id?: string | null;
  title: string;
  completed: boolean;
  position?: number | null;
  after_id?: string | null;
  expanded?: boolean;
}