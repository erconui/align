import AsyncStorage from '@react-native-async-storage/async-storage';
import {AddTaskParams, AddTemplateParams, TaskInstance, TaskTemplate, TaskTemplateRelation} from '../types';

const TASK_KEY = '@tasks_data';
const TEMPLATE_KEY = '@template_data';
const TEMPLATE_RELATION_KEY = '@template_relation_data';

export const webStorage = {
  generateId: (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },
  getTasks: async (): Promise<TaskInstance[]> => {
    try {
      const data = await AsyncStorage.getItem(TASK_KEY);
      const tasks = data ? JSON.parse(data) : [];
      return tasks.sort((a: TaskInstance, b: TaskInstance) => a.sort_order - b.sort_order);
    } catch (error) {
      console.error('Error getting tasks from storage:', error);
      return [];
    }
  },
  saveTasks: async (tasks: TaskInstance[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(TASK_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to storage:', error);
    }
  },
  getTemplates: async (): Promise<TaskTemplate[]> => {
    try {
      const data = await AsyncStorage.getItem(TEMPLATE_KEY);
      console.log(data);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting tasks from storage:', error);
      return [];
    }
  },
  saveTemplates: async (templates: TaskTemplate[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving tasks to storage:', error);
    }
  },
  getTemplateRelations: async (): Promise<TaskTemplateRelation[]> => {
    try {
      const data = await AsyncStorage.getItem(TEMPLATE_RELATION_KEY);
      const templates = data ? JSON.parse(data) : [];
      return templates.sort((a: TaskTemplateRelation, b: TaskTemplateRelation) => a.sort_order - b.sort_order);
    } catch (error) {
      console.error('Error getting tasks from storage:', error);
      return [];
    }
  },
  saveTemplateRelations: async (templates: TaskTemplateRelation[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(TEMPLATE_RELATION_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving tasks to storage:', error);
    }
  },
  addTask: async (task: AddTaskParams): Promise<string> => {
    try {
      const tasks = await webStorage.getTasks();
      const id = webStorage.generateId();
      console.log(`web basic add task ${task.title} under ${task.parent_id} after ${task.after_id} at ${task.sort_order}`);

      let sortOrder = task.sort_order;
      let parentId = task.parent_id;
      if (task.after_id) {
        const prevTask = tasks.find(t => t.id === task.after_id);
        if (!prevTask) {
          throw new Error('Task to insert after not found');
        }
        parentId = task.parent_id || prevTask.parent_id;
        tasks.forEach(t => {
          if (t.parent_id === parentId && t.sort_order > prevTask.sort_order) {
            t.sort_order += 1;
          }
        });
        sortOrder = prevTask.sort_order + 1;
        console.log(`web add task ${task.title} under ${prevTask.parent_id} after ${prevTask.title} at ${sortOrder}`);
      } else if (sortOrder === undefined) {
        const siblings = tasks.filter(t => t.parent_id === parentId);
        sortOrder = siblings.length;
      }
      console.log(`web create task ${id}, ${task.title}, ${parentId}, ${sortOrder}`);

      const newTask: TaskInstance = {
        id: id, //@ts-ignore
        parent_id: parentId, //@ts-ignore
        template_id: task.template_id,
        title: task.title,//@ts-ignore
        completed: task.completed ? 1 : 0,//@ts-ignore
        sort_order: sortOrder,
      };

      tasks.push(newTask);
      await webStorage.saveTasks(tasks);
      return id;
    } catch (error) {
      console.error('Error adding task to storage:', error);
      throw error;
    }
  },
  toggleTask: async (id: string, isCompleted: boolean): Promise<void> => {
    try {
      const tasks = await webStorage.getTasks();
      const taskIndex = tasks.findIndex(t => t.id === id);

      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          completed: isCompleted,
        };

        await webStorage.saveTasks(tasks);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  },
  deleteTask: async (id: string) => {
    try {
      const tasks = await webStorage.getTasks();
      const ids: string[] = [id];
      const findAllSubtasks = (parentId: string) => {
        const subtasks = tasks.filter(t => t.parent_id === parentId);
        subtasks.forEach((subtask) => {
          ids.push(subtask.id);
          findAllSubtasks(subtask.id);
        })
      };
      findAllSubtasks(id);
      const remainingTasks = tasks.filter(task => !ids.includes(task.id));
      await webStorage.saveTasks(remainingTasks);
    } catch (error) {
      console.error('Error deleting task from storage:', error);
    }
  },
  updateTaskTitle: async (id: string, title: string): Promise<void> => {
    try {
      const tasks = await webStorage.getTasks();
      const taskIndex = tasks.findIndex(t => t.id === id);

      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          title,
        };

        await webStorage.saveTasks(tasks);
      }
    } catch (error) {
      console.error('Error updating task title', error);
      throw error;
    }
  },
  createTemplate: async (template: AddTemplateParams): Promise<string> => {
    try {
      const templates = await webStorage.getTemplates();
      const relations = await webStorage.getTemplateRelations();

      const id = webStorage.generateId();
      console.log(`web basic add template ${template.title} with id ${id} under ${template.parent_id}`);
      const newTemplate: TaskTemplate = {
        id: id,
        title: template.title,
      };
      templates.push(newTemplate);
      await webStorage.saveTemplates(templates);
      let sortOrder = template.sort_order;
      let parentId = template.parent_id;
      if (template.after_id) {
        const rel = relations.find(r => r.id === template.after_id);
        if (!rel) {
          throw new Error('Relation not found');
        }
        parentId = template.parent_id || rel.parent_id;
        relations.forEach((relation) => {
          if (relation.parent_id === rel.parent_id && relation.sort_order > rel.sort_order) {
            relation.sort_order += 1;
          }
        });
        sortOrder = rel.sort_order + 1;
      } else if (sortOrder === undefined) {
        const siblings = relations.filter(rel =>
          rel.parent_id === template.parent_id
        );
        sortOrder = siblings.length;
      }

      if (parentId) {
        const relId = webStorage.generateId();
        const newRelation: TaskTemplate = {
          id: relId,
          parent_id: parentId,
          child_id: id,
          sort_order: sortOrder
        };
        console.log(`web create relationship parent ${template.parent_id} with child ${id} at position ${newRelation.sort_order}`);
        relations.push(newRelation);
        await webStorage.saveTemplateRelations(relations);
      }
      return id;
    } catch (error) {
      console.error('Error creating task template', error);
      throw error;
    }
  },
  updateTemplate: async (id: string, title: string): promise<void> => {
    try {
      const templates = await webStorage.getTemplates();
      const index = templates.findIndex(t => t.id === id);
      if (index !== -1) {
        templates[index] = {...templates[index], title};
        await webStorage.saveTemplates(templates);
      }
    } catch (error) {
      console.error('Error updating template title', error);
      throw error;
    }
  },
  getTemplateHierarchy: async (): Promise<{ templates: TaskTemplate[], relations: TaskTemplateRelation[] }> => {
    try {
      const templates = await webStorage.getTemplates();
      const relations = await webStorage.getTemplateRelations();
      console.log(`storage ${templates} relations ${relations}`);
      return {templates, relations};
    } catch (error) {
      console.error('Error getting template hierarchy', error);
      throw error;
    }
  },
  getRootTemplates: async (): Promise<TaskTemplate[]> => {
    try {
      const {templates, relations} = await webStorage.getTemplateHierarchy();
      const rootTemplates = templates.filter(template => {
        const hasParent = relations.some(rel => rel.child_id === template.id);
        return !hasParent;
      });
      console.log("TESTA templates", templates);
      console.log("TESTA root templates", rootTemplates);
      return rootTemplates; //TODO need sort order for roots, maybe by name, maybe by created date, maybe we create a value called root order?
    } catch (error) {
      console.error('Error getting root templates', error);
      throw error;
    }


  },
  getTemplateChildren: async (id: string): Promise<TaskTemplate[]> => {
    try {
      const {templates, relations} = await webStorage.getTemplateHierarchy();
      const childRelations = relations.filter(rel => rel.parent_id === id).sort((a, b) => a.sort_order - b.sort_order);
      const subtasks = childRelations.map(rel => templates.find(t => t.id === rel.child_id)).filter(Boolean) as TaskTemplate[];
      return subtasks;
    } catch (error) {
      console.error('Error getting template children', error);
      throw error;
    }
  },
  addTemplateRelation: async (parentId: string, childId: string, sortOrder: number | null): Promise<void> => {
    try {
      const relations = await webStorage.getTemplateRelations();
      if (relations.find(rel => rel.parent_id === parentId && rel.child_id === childId && rel.sort_order === sortOrder)) {
        console.log(`Template relationship parent ${parentId} with child ${childId} at position ${sortOrder} already exists`);
        return;
      }
      const siblings = relations.filter(rel =>
        rel.parent_id === parentId
      );
      if (sortOrder) {
        relations.forEach(rel => {
          if (rel.parent_id === parentId && rel.sort_order > sortOrder) {
            rel.sort_order += 1;
          }
        });
      }
      const id = webStorage.generateId();
      const newRelation: TaskTemplateRelation = {
        id: id,
        parent_id: parentId,
        child_id: childId,
        sort_order: sortOrder ? sortOrder : siblings.length
      }
      relations.push(newRelation);
      await webStorage.saveTemplateRelations(relations);
      console.log('added template relation');
    } catch (error) {
      console.log("Error adding template relation", error);
      throw error;
    }
  },
  deleteTemplate: async (id: string): Promise<void> => {
    try {
      let {templates, relations} = await webStorage.getTemplateHierarchy();
      let newTemplates = templates.filter((template: { id: string; }) => template.id !== id);
      let newRelations = relations.filter((relation: {
        parent_id: string;
        child_id: string;
      }) => relation.parent_id !== id && relation.child_id !== id);
      await webStorage.saveTemplates(newTemplates);
      await webStorage.saveTemplateRelations(newRelations);
      console.log('deleted template relation');
    } catch (error) {
      console.error('Error deleting template', error);
      throw error;
    }
  }
};

export const initStorage = async (): Promise<void> => {
  // No initialization needed for web
};
export const storage = webStorage;