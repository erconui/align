import { create } from 'zustand';
import { initStorage, storage } from '../storage/storage';
import { AddTaskParams, TaskInstance, TaskTemplate, TaskTemplateRelation } from '../types';

export type TaskNode = TaskInstance & { children: TaskNode[] };
export type TemplateNode = TaskTemplate & { children: TaskTemplate[], expanded: boolean };

interface TaskStore {
  tasks: TaskNode[];
  flatTasks: TaskInstance[];
  tree: TemplateNode[];
  flatTemplates: TaskTemplate[];
  templateHierarchy: { templates: TaskTemplate[], relations: TaskTemplateRelation[] };
  isLoading: boolean;
  focusedId: string | null;
  error: string | null;
  percentage: number;

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
  moveTask: (id: string, targetId: string, mode: string) => Promise<void>;

  // templates
  createTemplate: (title: string, parentId: string | null, expanded?: boolean) => Promise<string>;
  createTemplateWithoutLoad: (title: string, parentId: string | null, expanded?: boolean) => Promise<string>;
  addTemplateAfter: (title: string, afterId: string | null) => Promise<string>;
  getTemplateHierarchy: () => Promise<void>;
  getRootTemplates: () => Promise<TaskTemplate[]>;
  getTemplateChildren: (templateId: string) => Promise<TaskTemplate[]>;
  createTaskFromTemplate: (templateId: string, parentInstanceId?: string | null) => Promise<void>;
  createTemplateFromTask: (templateId: string, parentInstanceId?: string | null) => Promise<void>;
  updateTemplate: (templateId: string, newTitle: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addTemplateRelation: (parentId: string, childTemplateId: string, position?: number) => Promise<void>;
  loadTemplates: () => Promise<void>;
  buildTemplateTree: (templates: TaskTemplate[], relations: TaskTemplateRelation[]) => TemplateNode[];
  removeTemplate: (parentId: string | null, id: string) => Promise<void>;
  replaceTemplate: (parentId: string | null, oldId: string, newId: string) => Promise<void>;
  replaceTaskWithTemplate: (taskId: string, templateId: string) => Promise<void>;
  toggleTaskExpand: (id: string) => Promise<void>;
  toggleTemplateExpand: (parentId: string | null, id: string) => Promise<void>;
  calculatePercentage: (tree: TaskNode[]) => number;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  flatTasks: [],
  tree: [],
  flatTemplates: [],
  templateHierarchy: { templates: [], relations: [] },
  isLoading: false,
  focusedId: null,
  error: null,
  percentage: 0,

  init: async () => {
    try {
      set({ isLoading: true, error: null });
      await initStorage();
      await get().loadTasks();
      await get().loadTemplates();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  initDB: async () => {
    try {
      set({ isLoading: true, error: null });

      // Clear database
      await storage.clearDatabase();

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
      for (let idx = 5; idx < 7; idx++) {
        await get().addTaskWithoutLoad(`Task ${idx}`, null);
      }
      // Single load at the end
      await get().loadTasks();
      await get().loadTemplates();

      let id = await get().createTemplateWithoutLoad('clean house', null, true);

      let subId = await get().createTemplateWithoutLoad('clean bedroom', id, true);
      await get().createTemplateWithoutLoad('make bed', subId);
      await get().createTemplateWithoutLoad('organize closet', subId);
      await get().createTemplateWithoutLoad('clean dresser', subId);
      await get().createTemplateWithoutLoad('tidy', subId);
      await get().createTemplateWithoutLoad('vacuum', subId);
      await get().createTemplateWithoutLoad('mop', subId);
      subId = await get().createTemplateWithoutLoad('clean lounge', id, true);
      await get().createTemplateWithoutLoad('make couch', subId);
      await get().createTemplateWithoutLoad('organize closet', subId);
      await get().createTemplateWithoutLoad('tidy', subId);
      await get().createTemplateWithoutLoad('vacuum', subId);
      await get().createTemplateWithoutLoad('mop', subId);
      subId = await get().createTemplateWithoutLoad('clean bathroom', id, true);
      await get().createTemplateWithoutLoad('tidy', subId);
      await get().createTemplateWithoutLoad('clean vanity', subId);
      await get().createTemplateWithoutLoad('clean toilet', subId);
      await get().createTemplateWithoutLoad('clean bathtub', subId);
      await get().createTemplateWithoutLoad('vacuum', subId);
      await get().createTemplateWithoutLoad('mop', subId);

      id = await get().createTemplateWithoutLoad('grocery shopping', null, true);
      await get().createTemplateWithoutLoad('buy fruits', id);
      await get().createTemplateWithoutLoad('buy vegetables', id);
      await get().createTemplateWithoutLoad('buy snacks', id);
      await get().loadTemplates();


    } catch (error) {
      console.error('Error initializing database:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  loadTasks: async () => {
    try {
      const flatTasks = await storage.getTasks();
      const tree = get().getTree(flatTasks);
      console.log('Loaded tasks:');
      for (const t of flatTasks) {
        console.log(t);
      }
      set({
        tasks: tree,
        flatTasks: flatTasks,
        error: null
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  getTree: (tasks: TaskInstance[]) => {
    const map = new Map<string, TaskNode>();
    const roots: TaskNode[] = [];

    // Clone and clear children
    tasks?.forEach(task => {
      map.set(task.id, { ...task, children: [] });
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
    set({ percentage: get().calculatePercentage(roots) * 100 });

    return roots;
  },
  calculatePercentage: (tree: TaskNode[]): number => {
    let completion = 0.0;
    for (const task of tree) {
      if (!task.completed && task.children.length > 0) {
        let temp = get().calculatePercentage(task.children) / tree.length;
        completion += temp;
      } else {
        completion += task.completed ? 1 / tree.length : 0;
      }
    }
    return completion;
  },
  addTask: async (task: AddTaskParams): Promise<string> => {
    try {
      let id = await storage.addTask(task);
      await get().loadTasks();
      return id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  addSubTask: async (title: string, parentId: string | null): Promise<string> => {
    let id = await get().addTask({ title: title.trim(), parent_id: parentId, completed: false })
    set({ focusedId: id });
    return id;
  },
  addTaskAfter: async (title: string, afterId: string | null): Promise<string> => {
    let id = await get().addTask({ title: title.trim(), after_id: afterId, completed: false });
    set({ focusedId: id });
    return id;
  },
  addTaskWithoutLoad: async (title: string, parentId: string | null = null): Promise<string> => {
    if (!title.trim()) return '';

    try {
      return await storage.addTask({ title: title.trim(), parent_id: parentId, completed: false });
      // Don't call loadTasks here
    } catch (error) {
      set({ error: (error as Error).message });
      return '';
    }
  },
  updateTaskTitle: async (id: string, title: string) => {
    if (!title.trim()) return;

    try {
      await storage.updateTaskTitle(id, title.trim());
      await get().loadTasks();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  moveTask: async (id: string, targetId: string, mode: string) => {
    try {
      await storage.moveTask(id, targetId, mode);
      await get().loadTasks();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  deleteTask: async (id: string) => {
    try {
      await storage.deleteTask(id);
      await get().loadTasks();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  deleteAllTasks: async () => {
    try {
      const { flatTasks } = get();

      // Delete all tasks one by one
      for (const task of flatTasks) {
        await storage.deleteTask(task.id);
      }

      // Clear local state
      set({ flatTasks: [], tasks: [] });

    } catch (error) {
      console.error('Error clearing tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
  emptyDatabase: async () => {
    try {
      await storage.clearDatabase();
    } catch (error) {
      set({ error: (error as Error).message });
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
      set({ error: (error as Error).message });
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
      const siblings = await get().flatTasks.filter((t) => t.parent_id === task.parent_id && t.id !== task.id);

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
  createTemplate: async (title: string, parentId: string | null, expanded?: boolean): Promise<string> => {
    try {
      let newId = await storage.createTemplate({ title: title, parent_id: parentId, expanded: expanded });
      if (parentId === null) {
        await storage.createTemplate({ title: "", parent_id: newId });
      }
      await get().loadTemplates();
      return newId;
    } catch (error) {
      set({ error: (error as Error).message });
      return '';
    }
  },
  createTemplateWithoutLoad: async (title: string, parentId: string | null, expanded?: boolean): Promise<string> => {
    try {
      return await storage.createTemplate({ title: title, parent_id: parentId, expanded: expanded });
    } catch (error) {
      set({ error: (error as Error).message });
      return '';
    }
  },
  addTemplateAfter: async (title: string, afterId: string | null): Promise<string> => {
    try {
      // Find the template that we're inserting after to get its parent
      const { templateHierarchy } = get();
      const afterRelation = templateHierarchy.relations.find(rel => rel.child_id === afterId);
      const parentId = afterRelation?.parent_id || null;

      // Create the template with the same parent and after_id for positioning
      let id = await storage.createTemplate({
        title: title.trim(),
        parent_id: parentId,
        completed: false,
        after_id: afterId
      });
      if (parentId === null) {
        await storage.createTemplate({ title: "", parent_id: id });
      }
      await get().loadTemplates();
      set({ focusedId: id });
      return id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  getTemplateHierarchy: async () => {
    try {
      const hierarchy = await storage.getTemplateHierarchy();
      set({ templateHierarchy: hierarchy, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
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
      set({ error: (error as Error).message });
    }
  },
  createTemplateFromTask: async (taskId: string, parentInstanceId: string | null = null) => {
    try {
      await storage.createTemplateFromTask(taskId, parentInstanceId);
      await get().loadTemplates();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  updateTemplate: async (templateId: string, newTitle: string) => {
    try {
      await storage.updateTemplate(templateId, newTitle);
      await get().loadTemplates();
      await get().loadTasks(); // Refresh tasks to show template changes
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  replaceTemplate: async (parentId: string | null, oldId: string, newId: string) => {
    try {
      if (!parentId) {
        throw new Error('Parent ID is required to replace template relation');
      }
      await storage.replaceTemplate(parentId, oldId, newId);
      await get().loadTemplates();
      await get().loadTasks();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  replaceTaskWithTemplate: async (taskId: string, templateId: string) => {
    try {
      await storage.replaceTaskWithTemplate(taskId, templateId);
      await get().loadTemplates();
      await get().loadTasks();
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  deleteTemplate: async (id: string) => {
    try {
      await storage.deleteTemplate(id);
      await get().loadTemplates();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  addTemplateRelation: async (parentId: string, childTemplateId: string, position: number = 0) => {
    try {
      await storage.addTemplateRelation(parentId, childTemplateId, position);
      await get().loadTemplates();
    } catch (error) {
      set({ error: (error as Error).message });
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
          return { ...template, children: buildHierarchy(template.id), expanded: rel.expanded };
        }).filter(Boolean) as TemplateNode[];
    }
    const rootTemplates = templates.filter(template =>
      relations.some(rel => rel.child_id === template.id && rel.parent_id === null)
    );

    return rootTemplates.map(template => {
      const rel = relations.find(rel => rel.child_id === template.id && rel.parent_id === null);
      return { ...template, children: buildHierarchy(template.id), expanded: rel!.expanded };
    });
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
      set({ error: (error as Error).message });
    }
  },
  removeTemplate: async (parentId: string | null, id: string) => {
    try {
      await storage.removeTemplate(parentId, id);
      await get().loadTemplates();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  toggleTaskExpand: async (id: string) => {
    try {
      await storage.toggleTaskExpand(id);
      await get().loadTasks();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  toggleTemplateExpand: async (parentId: string | null, id: string) => {
    try {
      await storage.toggleTemplateExpand(parentId, id);
      await await get().loadTemplates();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  }
}));