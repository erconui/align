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
  position: number;
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
}

export interface TaskTemplateRelation {
  id: string;
  parent_id: string|null;
  child_id: string;
  position: number;
}