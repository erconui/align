import AsyncStorage from '@react-native-async-storage/async-storage';
import { AddTaskParams, AddTemplateParams, TaskInstance, TaskTemplate, TaskTemplateRelation } from '../types';

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
      return tasks.sort((a: TaskInstance, b: TaskInstance) => a.position - b.position);
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
      return templates.sort((a: TaskTemplateRelation, b: TaskTemplateRelation) => a.position - b.position);
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
      console.log(`web basic add task ${task.title} under ${task.parent_id} after ${task.after_id} at ${task.position}`);

      let position = task.position;
      let parentId = task.parent_id;
      if (task.after_id) {
        const prevTask = tasks.find(t => t.id === task.after_id);
        if (!prevTask) {
          throw new Error('Task to insert after not found');
        }
        parentId = task.parent_id || prevTask.parent_id;
        tasks.forEach(t => {
          if (t.parent_id === parentId && t.position > prevTask.position) {
            t.position += 1;
          }
        });
        position = prevTask.position + 1;
        console.log(`web add task ${task.title} under ${prevTask.parent_id} after ${prevTask.title} at ${position}`);
      } else if (position === undefined || position === null) {
        const siblings = tasks.filter(t => t.parent_id === parentId);
        position = siblings.length;
      }
      console.log(`web create task ${id}, ${task.title}, ${parentId}, ${position}`);

      const newTask: TaskInstance = {
        id: id, //@ts-ignore
        parent_id: parentId, //@ts-ignore
        template_id: task.template_id,
        title: task.title,//@ts-ignore
        completed: task.completed ? 1 : 0,//@ts-ignore
        completed_at: task.completed ? Date.now().toString() : null,
        due_date: null,
        created_at: Date.now().toString(),
        updated_at: Date.now().toString(),
        recurrence_rule: null,
        position: position,
        expanded: false
      };
      console.log("web create task", newTask);

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
          completed_at: isCompleted?Date.now().toString():null
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
        created_at: Date.now().toString(),
        updated_at: Date.now().toString()
      };
      templates.push(newTemplate);
      await webStorage.saveTemplates(templates);
      let position = template.position;
      let parentId = template.parent_id;
      if (template.after_id) {
        const rel = relations.find(r => r.child_id === template.after_id);
        if (!rel) {
          throw new Error('Relation not found');
        }
        parentId = template.parent_id || rel.parent_id;
        relations.forEach((relation) => {
          if (relation.parent_id === rel.parent_id && relation.position > rel.position) {
            relation.position += 1;
          }
        });
        position = rel.position + 1;
      } else if (position === undefined || position === null) {
        const siblings = relations.filter(rel =>
          rel.parent_id === template.parent_id
        );
        position = siblings.length;
      }

      // if (parentId) {
        const relId = webStorage.generateId();
        const newRelation: TaskTemplateRelation = {
          id: relId,
          parent_id: parentId||null,
          child_id: id,
          position: position,
          expanded: false,
          created_at: Date.now().toString(),
          updated_at: Date.now().toString()
        };
        console.log(`web create relationship parent ${template.parent_id} with child ${id} at position ${newRelation.position}`);
        relations.push(newRelation);
        await webStorage.saveTemplateRelations(relations);
      // }
      return id;
    } catch (error) {
      console.error('Error creating task template', error);
      throw error;
    }
  },
  updateTemplate: async (id: string, title: string): Promise<void> => {
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
      return rootTemplates; //TODO need sort order for roots, maybe by name, maybe by created date, maybe we create a value called root order?
    } catch (error) {
      console.error('Error getting root templates', error);
      throw error;
    }


  },
  getTemplateChildren: async (id: string): Promise<TaskTemplate[]> => {
    try {
      const {templates, relations} = await webStorage.getTemplateHierarchy();
      const childRelations = relations.filter(rel => rel.parent_id === id).sort((a, b) => a.position - b.position);
      const subtasks = childRelations.map(rel => templates.find(t => t.id === rel.child_id)).filter(Boolean) as TaskTemplate[];
      return subtasks;
    } catch (error) {
      console.error('Error getting template children', error);
      throw error;
    }
  },
  addTemplateRelation: async (parentId: string, childId: string, position: number | null): Promise<void> => {
    try {
      const relations = await webStorage.getTemplateRelations();
      if (relations.find(rel => rel.parent_id === parentId && rel.child_id === childId && rel.position === position)) {
        console.log(`Template relationship parent ${parentId} with child ${childId} at position ${position} already exists`);
        return;
      }
      const siblings = relations.filter(rel =>
        rel.parent_id === parentId
      );
      if (position) {
        relations.forEach(rel => {
          if (rel.parent_id === parentId && rel.position > position) {
            rel.position += 1;
          }
        });
      }
      const id = webStorage.generateId();
      const newRelation: TaskTemplateRelation = {
        id: id,
        parent_id: parentId,
        child_id: childId,
        position: position ? position : siblings.length,
        expanded: false,
        created_at: Date.now().toString(),
        updated_at: Date.now().toString()
      }
      relations.push(newRelation);
      await webStorage.saveTemplateRelations(relations);
      console.log('added template relation');
    } catch (error) {
      console.log("Error adding template relation", error);
      throw error;
    }
  },
  replaceTemplate: async (parentId: string, oldId: string, newId: string): Promise<void> => {
    try {
      const relations = await webStorage.getTemplateRelations();
      const relIdx = relations.findIndex(rel => rel.parent_id === parentId && rel.child_id === oldId);
      if (relIdx !== -1) {
        relations[relIdx].child_id = newId;
        if (!relations.find(rel => rel.parent_id === oldId || rel.child_id === oldId)) {
          await webStorage.deleteTemplate(oldId);
        }
      }
      await webStorage.saveTemplateRelations(relations);
    } catch (error) {
      console.error('Error replacing template relation', error);
      throw error;
    }
  },
  replaceTaskWithTemplate: async (taskId: string, templateId: string): Promise<void> => {
    try {
      console.log('Replacing task', taskId, 'with template', templateId);
      const tasks = await webStorage.getTasks();
      const templates = await webStorage.getTemplates();
      const relations = await webStorage.getTemplateRelations();
      
      // Find the task to replace
      const taskToReplace = tasks.find(t => t.id === taskId);
      if (!taskToReplace) {
        throw new Error(`Task with id ${taskId} not found`);
      }

      // Find the template to use
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template with id ${templateId} not found`);
      }

      // Delete all existing children of the task recursively
      const findAllSubtasks = (parentId: string): string[] => {
        const subtasks = tasks.filter(t => t.parent_id === parentId);
        const allIds: string[] = [];
        subtasks.forEach((subtask) => {
          allIds.push(subtask.id);
          allIds.push(...findAllSubtasks(subtask.id));
        });
        return allIds;
      };
      
      const childrenIds = findAllSubtasks(taskId);
      const remainingTasks = tasks.filter(task => !childrenIds.includes(task.id));

      // Update the task with new title and template_id
      const taskIndex = remainingTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        remainingTasks[taskIndex] = {
          ...remainingTasks[taskIndex],
          title: template.title,
          template_id: template.id,
        };
      }


      // Create tasks from template children recursively
      await webStorage.createTasksFromTemplateChildren(templateId, taskId, remainingTasks, relations, templates);

      // Save the updated tasks
      await webStorage.saveTasks(remainingTasks);
    } catch (error) {
      console.error('Error replacing task with template', error);
      throw error;
    }
  },
  deleteTemplate: async (id: string): Promise<void> => {
    try {
      let {templates, relations} = await webStorage.getTemplateHierarchy();
      let newTemplates = templates.filter((template: { id: string; }) => template.id !== id);
      let newRelations = relations.filter((relation) => relation.parent_id !== id && relation.child_id !== id);
      await webStorage.saveTemplates(newTemplates);
      await webStorage.saveTemplateRelations(newRelations);
      console.log('deleted template relation');
    } catch (error) {
      console.error('Error deleting template', error);
      throw error;
    }
  },
  createTaskFromTemplate: async (templateId: string, parentId: string | null = null): Promise<string> => {
    try {
      // const dbInstance = await db;
      console.log("creating task from template");
      const relations = await webStorage.getTemplateRelations();
      const templates = await webStorage.getTemplates()

      const template =  templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      console.log("create task from ", template);
      const id = await webStorage.addTask({template_id: templateId, parent_id: parentId, title: template.title, completed:false});

      const tasks = await webStorage.getTasks();
      await webStorage.createTasksFromTemplateChildren(templateId, id, tasks, relations, templates);
      await webStorage.saveTasks(tasks);
      return id;
    } catch (error) {
      console.error('Error creating task from template:', error);
      throw error;
    }
  //   return await database.createTaskFromTemplate(templateId, parentInstanceId);
  },
  createTemplateFromTask: async (taskId: string, parentInstanceId: string | null = null): Promise<string> => {
    try {
      console.log("Creating template from task:", taskId, "under parent template:", parentInstanceId);
      const tasks = await webStorage.getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      // Create the template from task
      const templateId = await webStorage.createTemplate({title: task.title, parent_id: parentInstanceId, completed: false});
      // Recursively create templates from task children
      const subtasks = tasks.filter(t => t.parent_id === task.id);
      for (const subtask of subtasks) {
        await webStorage.createTemplateFromTask(subtask.id, templateId);
      }
      return templateId;
    } catch (error) {
      console.error('Error creating template from task:', error);
      throw error;
    }
  },
  clearDatabase: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TASK_KEY);
      await AsyncStorage.removeItem(TEMPLATE_KEY);
      await AsyncStorage.removeItem(TEMPLATE_RELATION_KEY);
      console.log('Cleared database');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  },

  // Helper function to recursively create tasks from template children
  createTasksFromTemplateChildren: async (
    parentTemplateId: string,
    parentTaskId: string,
    tasksArray: TaskInstance[],
    relations: TaskTemplateRelation[],
    templates: TaskTemplate[]
  ): Promise<void> => {
    // Get children of the template
    const childRelations = relations.filter(rel => rel.parent_id === parentTemplateId)
      .sort((a, b) => a.position - b.position);
    
    for (const relation of childRelations) {
      const childTemplate = templates.find(t => t.id === relation.child_id);
      if (!childTemplate) continue;

      // Create task for this child template
      const childTaskId = webStorage.generateId();
      const siblingTasks = tasksArray.filter(t => t.parent_id === parentTaskId);
      const position = siblingTasks.length;

      const newTask: TaskInstance = {
        id: childTaskId,
        parent_id: parentTaskId,
        template_id: childTemplate.id,
        title: childTemplate.title,
        completed: false,
        expanded: false,
        position: position,
        completed_at: null,
        due_date: null,
        recurrence_rule: null,
        created_at: Date.now().toString(),
        updated_at: Date.now().toString()
      };

      tasksArray.push(newTask);

      // Recursively create tasks for grandchildren
      await webStorage.createTasksFromTemplateChildren(childTemplate.id, childTaskId, tasksArray, relations, templates);
    }
  }
};

export const initStorage = async (): Promise<void> => {
  // No initialization needed for web
};
export const storage = webStorage;