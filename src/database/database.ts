import * as SQLite from 'expo-sqlite';
import {AddTaskParams, TaskInstance, TaskTemplate, TaskTemplateRelation} from '../types';

// Open database with async API
const db = SQLite.openDatabaseAsync('tasks.db');

export const initDatabase = async (): Promise<void> => {
  try {
    const dbInstance = await db;

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS templates
        (
            id    TEXT PRIMARY KEY,
            title TEXT NOT NULL
        );
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS template_relations
        (
            id                 TEXT PRIMARY KEY,
            parent_template_id TEXT    NOT NULL,
            child_template_id  TEXT    NOT NULL,
            sort_order         INTEGER NOT NULL,
            FOREIGN KEY (parent_template_id) REFERENCES templates (id),
            FOREIGN KEY (child_template_id) REFERENCES templates (id)
        );
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks
        (
            id          TEXT PRIMARY KEY,
            template_id TEXT,
            parent_id   TEXT,
            title       TEXT    NOT NULL,
            completed   BOOLEAN NOT NULL DEFAULT 0,
--         due_date DATETIME,
--         recurrence_rule TEXT,
--         completed_at DATETIME,
            sort_order  INTEGER NOT NULL DEFAULT 0,
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (template_id) REFERENCES templates (id),
            FOREIGN KEY (parent_id) REFERENCES tasks (id)
        );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Database operations
export const database = {
  // Get all root tasks (tasks without parents)
  getRootTasks: async (): Promise<TaskInstance[]> => {
    try {
      const dbInstance = await db;
      return await dbInstance.getAllAsync<TaskInstance>(
        `SELECT *
         FROM tasks
         WHERE parent_id IS NULL
         ORDER BY sort_order ASC`
      );
    } catch (error) {
      console.error('Error getting root tasks:', error);
      throw error;
    }
  },
  getAllTasks: async (): Promise<TaskInstance[]> => {
    try {
      const dbInstance = await db;
      return await dbInstance.getAllAsync<TaskInstance>(
        `SELECT *
         FROM tasks
         ORDER BY sort_order ASC`
      );
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  },

  // Add a new task
  addTask: async (task: AddTaskParams): Promise<string> => {
    try {
      const dbInstance = await db;
      let parentId = task.parent_id ?? null;
      let sortOrder = task.sort_order;

      if (task.after_id) {
        const prevTask = await dbInstance.getFirstAsync<TaskInstance>('SELECT * FROM tasks WHERE id = ?', [task.after_id]);
        if (!prevTask) {
          throw new Error('Task to insert after not found');
        }
        parentId = task.parent_id ?? prevTask.parent_id;

        await dbInstance.runAsync('UPDATE tasks SET sort_order = sort_order + 1 WHERE parent_id IS ? AND sort_order > ?',
          [parentId, prevTask.sort_order]);
        sortOrder = prevTask.sort_order + 1;
      } else if (sortOrder === undefined) {
        const result = await dbInstance.getFirstAsync<{
          count: number
        }>('SELECT COUNT(*) as count FROM tasks WHERE parent_id IS ?',
          [parentId]);
        sortOrder = result?.count || 0;
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      await dbInstance.runAsync(
        `INSERT INTO tasks
             (id, template_id, parent_id, title, completed, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          task.template_id || null,
          parentId || null,
          task.title,
          task.completed ? 1 : 0,
          sortOrder,
        ]
      );

      return id;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  // Update task completion status
  toggleTask: async (id: string, isCompleted: boolean): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.runAsync(
        `UPDATE tasks
         SET completed = ? --
         WHERE id = ?`,
        [
          isCompleted ? 1 : 0,
          id
        ]
      );
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  },

  // Delete a task and all its subtasks
  deleteTask: async (id: string): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.runAsync(`
          WITH RECURSIVE descendants AS (SELECT id
                                         FROM tasks
                                         WHERE id = ?
                                         UNION ALL
                                         SELECT t.id
                                         FROM tasks t
                                                  JOIN descendants d ON t.parent_id = d.id)
          DELETE
          FROM tasks
          WHERE id IN (SELECT id FROM descendants)
      `, [id]);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Update task title
  updateTaskTitle: async (id: string, title: string): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.runAsync(
        'UPDATE tasks SET title = ? WHERE id = ?',
        [title, id]
      );
    } catch (error) {
      console.error('Error updating task title:', error);
      throw error;
    }
  },

  // Template functions// Create a template (optionally under a parent template)
  createTemplate: async (title: string, parentTemplateId: string | null = null): Promise<string> => {
    try {
      const dbInstance = await db;
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await dbInstance.runAsync(
        'INSERT INTO templates (id, title) VALUES (?, ?)',
        [id, title.trim()]
      );

      // If this template has a parent, create the relation
      if (parentTemplateId) {
        await dbInstance.runAsync(
          'INSERT INTO template_relations (parent_template_id, child_template_id, sort_order) VALUES (?, ?, ?)',
          [parentTemplateId, id, 0] // sort_order 0 for now
        );
      }

      return id;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  // Get full template hierarchy for UI
  getTemplateHierarchy: async (): Promise<{ templates: TaskTemplate[], relations: TaskTemplateRelation[] }> => {
    try {
      const dbInstance = await db;
      const templates = await dbInstance.getAllAsync<TaskTemplate>(`
          SELECT *
          FROM templates
      `);

      const relations = await dbInstance.getAllAsync<TaskTemplateRelation>(`
          SELECT *
          FROM template_relations
          ORDER BY sort_order ASC
      `);

      return {templates, relations};
    } catch (error) {
      console.error('Error getting template hierarchy:', error);
      throw error;
    }
  },

  // Get templates that are roots (no parents OR have children)
  getRootTemplates: async (): Promise<TaskTemplate[]> => {
    try {
      const dbInstance = await db;
      return await dbInstance.getAllAsync<TaskTemplate>(`
          SELECT t.*
          FROM templates t
          WHERE t.id NOT IN (SELECT child_template_id
                             FROM template_relations)
             OR t.id IN (SELECT parent_template_id
                         FROM template_relations)
      `);
    } catch (error) {
      console.error('Error getting root templates:', error);
      throw error;
    }
  },

  // Get children of a template
  getTemplateChildren: async (templateId: string): Promise<TaskTemplate[]> => {
    try {
      const dbInstance = await db;
      const result = await dbInstance.getAllAsync<TaskTemplate>(`
          SELECT t.*
          FROM templates t
                   INNER JOIN template_relations r ON t.id = r.child_template_id
          WHERE r.parent_template_id = ?
          ORDER BY r.sort_order ASC
      `, [templateId]);

      return result;
    } catch (error) {
      console.error('Error getting template children:', error);
      throw error;
    }
  },

  // Create task instance from template (with full hierarchy)
  createTaskFromTemplate: async (templateId: string, parentInstanceId: string | null = null): Promise<string> => {
    try {
      const dbInstance = await db;
      const template = await dbInstance.getFirstAsync<TaskTemplate>(
        'SELECT * FROM templates WHERE id = ?',
        [templateId]
      );

      if (!template) {
        throw new Error('Template not found');
      }

      // Create the main task from template
      const taskId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      await dbInstance.runAsync(
        `INSERT INTO tasks (id, template_id, parent_id, title, completed, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [taskId, templateId, parentInstanceId, template.title, 0, 0] // completed=0 = bound to template
      );

      // Recursively create tasks from template children
      const childTemplates = await dbInstance.getAllAsync<TaskTemplate>(`
          SELECT t.*
          FROM templates t
                   INNER JOIN template_relations r ON t.id = r.child_template_id
          WHERE r.parent_template_id = ?
          ORDER BY r.sort_order ASC
      `, [templateId]);

      for (const childTemplate of childTemplates) {
        await database.createTaskFromTemplate(childTemplate.id, taskId);
      }

      return taskId;
    } catch (error) {
      console.error('Error creating task from template:', error);
      throw error;
    }
  },

// Update template title and structure
  updateTemplate: async (templateId: string, newTitle: string, newChildren: string[]): Promise<void> => {
    try {
      // Update template title
      const dbInstance = await db;
      await dbInstance.runAsync(
        'UPDATE templates SET title = ? WHERE id = ?',
        [newTitle.trim(), templateId]
      );

      // Get current children
      const currentChildren = await dbInstance.getAllAsync<{ child_template_id: string }>(
        'SELECT child_template_id FROM template_relations WHERE parent_template_id = ?',
        [templateId]
      );
      const currentChildIds = currentChildren.map(c => c.child_template_id);

      // Find children to remove
      const childrenToRemove = currentChildIds.filter(id => !newChildren.includes(id));
      for (const childId of childrenToRemove) {
        await dbInstance.runAsync(
          'DELETE FROM template_relations WHERE parent_template_id = ? AND child_template_id = ?',
          [templateId, childId]
        );
      }

      // Find children to add
      const childrenToAdd = newChildren.filter(id => !currentChildIds.includes(id));
      for (let i = 0; i < childrenToAdd.length; i++) {
        await dbInstance.runAsync(
          'INSERT INTO template_relations (parent_template_id, child_template_id, sort_order) VALUES (?, ?, ?, ?)',
          [templateId, childrenToAdd[i], i]
        );
      }

      // Update sort order for existing children
      for (let idx = 0; idx < newChildren.length; idx++) {
        if (currentChildIds.includes(newChildren[idx])) {
          await dbInstance.runAsync(
            'UPDATE template_relations SET sort_order = ? WHERE parent_template_id = ? AND child_template_id = ?',
            [idx, templateId, newChildren[idx]]
          );
        }
      }

      // Sync changes to all bound task instances
      await database.syncTemplateChanges(templateId);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

// Sync template changes to all bound task instances
  syncTemplateChanges: async (templateId: string): Promise<void> => {
    try {
      const dbInstance = await db;
      const template = await dbInstance.getFirstAsync<TaskTemplate>(
        'SELECT * FROM tasks WHERE id = ?',
        [templateId]
      );

      if (!template) return;

      // Get all bound task instances of this template (completed = 0)
      const boundInstances = await dbInstance.getAllAsync<TaskInstance>(
        'SELECT * FROM tasks WHERE template_id = ? AND completed = 0',
        [templateId]
      );

      for (const instance of boundInstances) {
        // Update title if it hasn't been manually changed
        // (simple heuristic: if title matches template's original structure)
        if (instance.title === template.title) {
          await dbInstance.runAsync(
            'UPDATE tasks SET title = ? WHERE id = ?',
            [template.title, instance.id]
          );
        }

        // Get template children
        const templateChildren = await database.getTemplateChildren(templateId);

        // Get current instance children
        const instanceChildren = await dbInstance.getAllAsync<TaskInstance>(
          'SELECT * FROM tasks WHERE parent_id = ?',
          [instance.id]
        );

        // Sync children structure
        // This is simplified - in practice you'd want more sophisticated diffing
        for (const templateChild of templateChildren) {
          const existingChild = instanceChildren.find(child =>
            (child.template_id === templateChild.id) && !child.completed
          );

          if (!existingChild) {
            // Create missing child
            await database.createTaskFromTemplate(templateChild.id, instance.id);
          }
        }

        // Remove unchecked children that are no longer in template
        for (const instanceChild of instanceChildren) {
          if (!instanceChild.completed && instanceChild.template_id) {
            const stillInTemplate = templateChildren.some(tc => tc.id === instanceChild.template_id);
            if (!stillInTemplate) {
              await database.deleteTask(instanceChild.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing template changes:', error);
      throw error;
    }
  },

// Delete template and its relations
  deleteTemplate: async (id: string): Promise<void> => {
    try {
      // First delete any relations involving this template
      const dbInstance = await db;
      await dbInstance.runAsync(`
          DELETE
          FROM template_relations
          WHERE parent_template_id = ?
             OR child_template_id = ?
      `, [id, id]);

      // Then delete the template itself
      await dbInstance.runAsync('DELETE FROM templates WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

// Add template relation (for building hierarchies)
  addTemplateRelation: async (parentTemplateId: string, childTemplateId: string, sortOrder: number = 0): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.runAsync(
        'INSERT INTO template_relations (parent_template_id, child_template_id, sort_order) VALUES (?, ?, ?, ?)',
        [parentTemplateId, childTemplateId, sortOrder]
      );
    } catch (error) {
      console.error('Error adding template relation:', error);
      throw error;
    }
  },
};