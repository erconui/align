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
  position: number;
  expanded: boolean;
  private: boolean;
  backlog: boolean;
  labels: string
  recurrence_rule_id: string | null;
  recurrence?   : RecurrenceRule | null;
}
export type TaskParams = 
  Partial<Omit<TaskInstance,'id'>> & 
  Pick<TaskInstance,'id'> & 
  { after_id?: string | null; };

export interface RecurrenceRule {
  frequency: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval?: number;
  by_day?: number[];
  skip_if_missed?: boolean;
  end_type: "never" | "on" | "after";
  end_date: string | null;
  occurrences: number;
}

export interface TaskTemplate {
  id: string;
  title: string;
  private: boolean;
  created_at: string;
  updated_at: string;
}
export type ListParams = 
  Partial<Omit<TaskTemplate,'id'>> & 
  Pick<TaskTemplate,'id'> & 
  { parent_id?: string | null;
    after_id?: string | null;
    position?: number | null;
    expanded?: boolean;
    rootLevel?: boolean;
    unlink?: boolean;
   };

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
  position?: number | null;
  after_id?: string | null;
  expanded?: boolean;
}


export type TaskNode = TaskInstance & { children: TaskNode[] };
export type TemplateNode = TaskTemplate & { children: TaskTemplate[], expanded: boolean, relId: string, position: number };
export type Suggestion = TaskTemplate & { parents: string[] };

export type Mode =  'single'|'agenda'|'current'|'backlog'|'all';