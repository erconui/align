import { create } from 'zustand';
import { initStorage, storage } from '../storage/storage';
import { AddTaskParams, TaskInstance, TaskTemplate, TaskTemplateRelation } from '../types';

export type TaskNode = TaskInstance & { children: TaskNode[] };
export type TemplateNode = TaskTemplate & { children: TaskTemplate[] };

interface TaskStore {
  tasks: TaskNode[];
  flatTasks: TaskInstance[];
  tree: TemplateNode[];
  flatTemplates: TaskTemplate[];
  templateHierarchy: { templates: TaskTemplate[], relations: TaskTemplateRelation[] };
  isLoading: boolean;
  focusedId: string | null;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  initDB: () => Promise<void>;
  loadTasks: () => Promise<void>;
  getTree: (tasks: TaskInstance[]) => TaskNode[];
  addTask: (task: AddTaskParams) => Promise<string>;
  addSubTask: (title: string, parentId: string | null) => Promise<string>;
  addTaskAfter: (title: string, afterId: string | null) => Promise<string>;
  addTaskWithoutLoad: (id: string, parentId: string | null) => Promise<string>;
  updateTaskTitle: (id: string, title: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteAllTasks: () => void;
  toggleTask: (id: string) => Promise<void>;
  recursiveUpdateChildren: (id: string, completed: boolean) => Promise<void>;
  recursiveUpdateParents: (id: string | null, completed: boolean) => Promise<void>;

  // templates
  createTemplate: (title: string, parentId: string | null) => Promise<void>;
  addTemplateAfter: (title: string, afterId: string | null) => Promise<string>;
  getTemplateHierarchy: () => Promise<void>;
  getRootTemplates: () => Promise<TaskTemplate[]>;
  getTemplateChildren: (templateId: string) => Promise<TaskTemplate[]>;
  createTaskFromTemplate: (templateId: string, parentInstanceId?: string | null) => Promise<void>;
  updateTemplate: (templateId: string, newTitle: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addTemplateRelation: (parentId: string, childTemplateId: string, position?: number) => Promise<void>;
  loadTemplates: () => Promise<void>;
  buildTemplateTree: (templates: TaskTemplate[], relations: TaskTemplateRelation[]) => TemplateNode[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  flatTasks: [],
  tree: [],
  flatTemplates: [],
  templateHierarchy: {templates: [], relations: []},
  isLoading: false,
  focusedId: null,
  error: null,

  init: async () => {
    try {
      set({isLoading: true, error: null});
      await initStorage();
      await get().loadTasks();
      await get().loadTemplates();
    } catch (error) {
      set({error: (error as Error).message});
    } finally {
      set({isLoading: false});
    }
  },
  initDB: async () => {
    try {
      set({isLoading: true, error: null});

      // Clear all existing tasks
      await get().deleteAllTasks();

      // Create all tasks first, then load once at the end
      const task1id = await get().addTaskWithoutLoad('Task 1', null);
      const task2id = await get().addTaskWithoutLoad('Task 2', null);
      const task3id = await get().addTaskWithoutLoad('Task 3', null);
      if (task1id) await get().addTaskWithoutLoad('Sub 1', task1id);
      if (task3id) {
        const sub2id = await get().addTaskWithoutLoad('Sub 2', task3id);
        await get().addTaskWithoutLoad('Sub 3', task3id);
        const sub4 = await get().addTaskWithoutLoad('Sub 4', task3id);
        await get().addTaskWithoutLoad('Sub 5', sub4);
      }
      await get().addTaskWithoutLoad('Task 4', null);
      for (let idx = 5; idx < 15; idx++) {
        await get().addTaskWithoutLoad(`Task ${idx}`, null);
      }
      // Single load at the end
      await get().loadTasks();

    } catch (error) {
      console.error('Error initializing database:', error);
      set({error: (error as Error).message});
    } finally {
      set({isLoading: false});
    }
  },
  loadTasks: async () => {
    try {
      const flatTasks = await storage.getTasks();
      const tree = get().getTree(flatTasks);
      set({
        tasks: tree,
        flatTasks: flatTasks,
        error: null
      });
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  getTree: (tasks: TaskInstance[]) => {
    const map = new Map<string, TaskNode>();
    const roots: TaskNode[] = [];

    // Clone and clear children
    tasks?.forEach(task => {
      map.set(task.id, {...task, children: []});
    });

    // Build hierarchy
    tasks?.forEach(task => {
      const node = map.get(task.id)!;
      if (task.parent_id) {
        const parent = map.get(task.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  },
  addTask: async (task: AddTaskParams): Promise<string> => {
    try {
      console.log(`add task ${task.title} under ${task.parent_id} after ${task.after_id}`);
      let id = await storage.addTask(task);
      await get().loadTasks();
      return id;
    } catch (error) {
      set({error: (error as Error).message});
      throw error;
    }
  },
  addSubTask: async (title: string, parentId: string | null): Promise<string> => {
    console.log(`Add task ${title} as subtask to parent ${parentId}`);
    let id = await get().addTask({title: title.trim(), parent_id: parentId, completed: false})
    set({focusedId: id});
    return id;
  },
  addTaskAfter: async (title: string, afterId: string | null) : Promise<string> => {
    let id = await get().addTask({title: title.trim(), after_id: afterId, completed: false});
    set({focusedId: id});
    return id;
  },
  addTaskWithoutLoad: async (title: string, parentId: string | null = null): Promise<string> => {
    if (!title.trim()) return '';

    try {
      return await storage.addTask({title: title.trim(), parent_id: parentId, completed: false});
      // Don't call loadTasks here
    } catch (error) {
      set({error: (error as Error).message});
      return '';
    }
  },
  updateTaskTitle: async (id: string, title: string) => {
    if (!title.trim()) return;

    try {
      await storage.updateTaskTitle(id, title.trim());
      await get().loadTasks();
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  deleteTask: async (id: string) => {
    try {
      await storage.deleteTask(id);
      await get().loadTasks();
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  deleteAllTasks: async () => {
    try {
      const {flatTasks} = get();

      // Delete all tasks one by one
      for (const task of flatTasks) {
        await storage.deleteTask(task.id);
      }

      // Clear local state
      set({flatTasks: [], tasks: []});

    } catch (error) {
      console.error('Error clearing tasks:', error);
      set({error: (error as Error).message});
      throw error;
    }
  },
  toggleTask: async (id: string) => {
    try {
      const task = get().flatTasks.find(t => t.id === id);
      if (!task) return;

      await storage.toggleTask(id, !task.completed);
      await get().recursiveUpdateChildren(id, !task.completed);
      await get().recursiveUpdateParents(id, !task.completed);
      await get().loadTasks();
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  recursiveUpdateChildren: async (id: string, completed: boolean) => {
    const subtasks = get().flatTasks.filter((task) => task.parent_id === id);
    for (const subtask of subtasks) {
      if (subtask.completed !== completed) {
        await storage.toggleTask(subtask.id, completed);
        await get().recursiveUpdateChildren(subtask.id, completed);
      }
    }
  },
  recursiveUpdateParents: async (id: string | null, completed: boolean) => {
    const task = get().flatTasks.find(t => t.id === id);
    if (!task) return;
    const parent = get().flatTasks.find((t) => t.id === task.parent_id);
    if (!parent) return;
    if (parent.completed === completed) return; // if the parent already matches the state of the current task, exit

    let updateParent = true;
    if (completed) { // to check off parent, all siblings must be checked off as well
      const siblings = await get().flatTasks.filter((t) => t.parent_id === task.parent_id);

      siblings.forEach((sibling) => {
        // If there are any siblings that do not match the updated completed state then don't change the parent
        if (sibling.id !== task.id && sibling.completed !== completed) {
          updateParent = false;
        }
      })
    }

    if (updateParent) {
      await storage.toggleTask(parent.id, completed);
      await get().recursiveUpdateParents(task.parent_id, completed);
    }
  },
  // Template actions
  createTemplate: async (title: string, parentId: string | null) => {
    try {
      await storage.createTemplate({title: title, parent_id: parentId});
      await get().loadTemplates();
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  addTemplateAfter: async (title: string, afterId: string | null) : Promise<string> => {
    try {
      // Find the template that we're inserting after to get its parent
      const {templateHierarchy} = get();
      const afterRelation = templateHierarchy.relations.find(rel => rel.child_id === afterId);
      const parentId = afterRelation?.parent_id || null;
      
      // Create the template with the same parent and after_id for positioning
      let id = await storage.createTemplate({
        title: title.trim(), 
        parent_id: parentId,
        completed: false,
        after_id: afterId
      });
      await get().loadTemplates();
      return id;
    } catch (error) {
      set({error: (error as Error).message});
      throw error;
    }
  },
  getTemplateHierarchy: async () => {
    try {
      const hierarchy = await storage.getTemplateHierarchy();
      console.log('store hierarchy', hierarchy);
      set({templateHierarchy: hierarchy, error: null});
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  getRootTemplates: async (): Promise<TaskTemplate[]> => {
    return await storage.getRootTemplates();
  },
  getTemplateChildren: async (templateId: string): Promise<TaskTemplate[]> => {
    return await storage.getTemplateChildren(templateId);
  },
  createTaskFromTemplate: async (templateId: string, parentInstanceId: string | null = null) => {
    try {
      await storage.createTaskFromTemplate(templateId, parentInstanceId);
      await get().loadTasks();
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  updateTemplate: async (templateId: string, newTitle: string) => {
    try {
      await storage.updateTemplate(templateId, newTitle);
      await get().loadTemplates();
      await get().loadTasks(); // Refresh tasks to show template changes
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  deleteTemplate: async (id: string) => {
    try {
      console.log("store delete template", id);
      await storage.deleteTemplate(id);
      await get().loadTemplates();
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  addTemplateRelation: async (parentId: string, childTemplateId: string, position: number = 0) => {
    try {
      await storage.addTemplateRelation(parentId, childTemplateId, position);
      await get().loadTemplates();
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
  buildTemplateTree: (templates: TaskTemplate[], relations: TaskTemplateRelation[]): TemplateNode[] => {
    const buildHierarchy = (parentId: string): TemplateNode[] => {
      return relations
        .filter(rel => rel.parent_id === parentId)
        .sort((a, b) => a.position - b.position)
        .map(rel => {
          const template = templates.find(t => t.id === rel.child_id);
          if (!template) return null;
          return {...template, children: buildHierarchy(template.id)};
        }).filter(Boolean) as TemplateNode[];
    }
    const rootTemplates = templates.filter(template =>
      !relations.some(rel => rel.child_id === template.id) ||
      relations.some(rel => rel.parent_id === template.id)
    );
    return rootTemplates.map(template => ({
      ...template, children: buildHierarchy(template.id)
    }));
  },
  loadTemplates: async () => {
    try {
      const hierarchy = await storage.getTemplateHierarchy();
      const newTree = get().buildTemplateTree(hierarchy.templates, hierarchy.relations);
      set({
        tree: newTree,
        templateHierarchy: hierarchy,
        error: null
      });
    } catch (error) {
      set({error: (error as Error).message});
    }
  },
}));