import * as SQLite from 'expo-sqlite';
import { AddTaskParams, AddTemplateParams, TaskInstance, TaskTemplate, TaskTemplateRelation } from '../types';

// Open database with async API
const db = SQLite.openDatabaseAsync('tasks.db');

export const initDatabase = async (): Promise<void> => {
  try {
    const dbInstance = await db;

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS templates
        (
            id    TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS template_relations
        (
            id                 TEXT PRIMARY KEY,
            parent_id TEXT,
            child_id  TEXT    NOT NULL,
            position           INTEGER NOT NULL,
            expanded   BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES templates (id),
            FOREIGN KEY (child_id) REFERENCES templates (id)
        );
    `);

    await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks
        (
            id          TEXT PRIMARY KEY,
            template_id TEXT,
            parent_id   TEXT,
            title       TEXT    NOT NULL,
            expanded   BOOLEAN NOT NULL DEFAULT 0,
            completed   BOOLEAN NOT NULL DEFAULT 0,
            completed_at DATETIME,
            due_date DATETIME,
            recurrence_rule TEXT,
            position  INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (template_id) REFERENCES templates (id),
            FOREIGN KEY (parent_id) REFERENCES tasks (id)
        );
    `);

    await dbInstance.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_template_updated_at 
        AFTER UPDATE ON templates
        BEGIN
          UPDATE templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;`
    );

    await dbInstance.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_template_relation_updated_at 
        AFTER UPDATE ON template_relations
        BEGIN
          UPDATE template_relations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;`
    );

    await dbInstance.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
        AFTER UPDATE ON tasks
        BEGIN
          UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;`
    );

    await dbInstance.execAsync(`
      CREATE TRIGGER IF NOT EXISTS update_tasks_completed_at
        AFTER UPDATE OF completed ON tasks
        FOR EACH ROW
        WHEN (NEW.completed != OLD.completed AND NEW.completed_at IS NULL)
        BEGIN
            UPDATE tasks 
            SET completed_at = 
                CASE 
                    WHEN NEW.completed = 1 THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END
            WHERE id = NEW.id;
        END;
    `);

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
         ORDER BY position ASC`
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
         ORDER BY position ASC`
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
      let position = task.position;

      if (task.after_id) {
        const prevTask = await dbInstance.getFirstAsync<TaskInstance>('SELECT * FROM tasks WHERE id = ?', [task.after_id]);
        if (!prevTask) {
          throw new Error('Task to insert after not found');
        }
        parentId = task.parent_id ?? prevTask.parent_id;

        await dbInstance.runAsync('UPDATE tasks SET position = position + 1 WHERE parent_id IS ? AND position > ?',
          [parentId, prevTask.position]);
        position = prevTask.position + 1;
      } else if (position === undefined) {
        const result = await dbInstance.getFirstAsync<{
          count: number
        }>('SELECT COUNT(*) as count FROM tasks WHERE parent_id IS ?',
          [parentId]);
        position = result?.count || 0;
      }

      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      await dbInstance.runAsync(
        `INSERT INTO tasks
             (id, template_id, parent_id, title, completed, position, expanded)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          task.template_id || null,
          parentId || null,
          task.title,
          task.completed ? 1 : 0,
          position,
          false
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
         SET completed = ?,
         completed_at = ?
         WHERE id = ?`,
        [
          isCompleted ? 1 : 0,
          isCompleted?Date.now():null,
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
      await dbInstance.runAsync(
        `UPDATE tasks
          SET expanded = 0
          WHERE id IN (
              SELECT t1.parent_id
              FROM tasks t1
              JOIN (
                  SELECT parent_id
                  FROM tasks
                  WHERE parent_id IS NOT NULL
                  GROUP BY parent_id
                  HAVING COUNT(*) = 1
              ) t2 ON t1.parent_id = t2.parent_id
              WHERE t1.id = ?
          )`,
        [id]
      );
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
        'UPDATE tasks SET title = ?, updated_at = ? WHERE id = ?',
        [title, Date.now(), id]
      );
    } catch (error) {
      console.error('Error updating task title:', error);
      throw error;
    }
  },

  moveTask: async (id: string, targetId: string, levelsOffset: number): Promise<void> => {
    try {
      const dbInstance = await db;
      const movingTask = await dbInstance.getFirstAsync<TaskInstance>(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );
      let target = await dbInstance.getFirstAsync<TaskInstance>(
        'SELECT * FROM tasks WHERE id = ?',
        [targetId]
      );
      if (id === targetId && levelsOffset>=0){
        throw new Error('Trying to move task to itself');
      }

      if (!movingTask) {
        throw new Error('Moving task task not found');
      }
      if (targetId !== null && !target) {
        throw new Error('Target not found');
      }

      let parentId = null;
      let position = 0;
      if (target) {
        parentId = target.parent_id;
        if ( levelsOffset === 0) {
          position = target.position + 1;
        } else if (levelsOffset === 1) {
          parentId = target.id;
          if (!target.expanded) {
            const result = await dbInstance.getFirstAsync<{ count: number }>(
              'SELECT COUNT(*) as count FROM tasks WHERE parent_id IS ?',
              [parentId]);
            position = result?.count || 0;
          }
        } else {
          while (levelsOffset < 0 && parentId) {
            target = await dbInstance.getFirstAsync<TaskInstance>(
              'SELECT * FROM tasks WHERE id = ?',
              [parentId]
            );
            levelsOffset++;
            if (!target) {
              throw new Error('Database corrupted, parentId points at a nonexistent target');
            }
            parentId = target.parent_id;
            position = target.position + 1;
          }
        }
      }

      // make space in the new position for the moving task
      await dbInstance.runAsync(
        'Update tasks set position = position + 1 where parent_id IS ? AND position >= ?',
        [parentId, position]
      );
      await dbInstance.runAsync(
        'UPDATE tasks SET parent_id = ?, position = ? WHERE id = ?',
        [parentId, position, id]
      );
      // Remove moving task from its current position
      await dbInstance.runAsync(
        'UPDATE tasks SET position = position - 1 WHERE parent_id IS ? AND position > ?',
        [movingTask.parent_id, movingTask.position]
      );
      await dbInstance.runAsync(
        'Update tasks set expanded = 1 where id IS ?',
        [parentId]
      );
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  },
  //TODO update corresponding tasks
  moveTemplate: async (relId: string, targetId: string, levelsOffset: number): Promise<void> => {
    try {
      const dbInstance = await db;
      const relation = await dbInstance.getFirstAsync<TaskTemplateRelation>(
        'SELECT * FROM template_relations WHERE id = ?',[relId]
      );
      let target = await dbInstance.getFirstAsync<TaskTemplateRelation>(
        'SELECT * FROM template_relations WHERE id = ?',[targetId]
      );
      if (!relation) {
        throw new Error('Moving task task not found');
      }
      if (targetId !== null && !target) {
        throw new Error('Target not found');
      }
      
      let target_pos;
      let parentId = null;
      let position = 0;
      if (target) {
        parentId = target.parent_id;
        if ( levelsOffset === 0) {
          position = target.position + 1;
        } else if (levelsOffset === 1) {
          parentId = target.child_id;
          if (!target.expanded) {
            const result = await dbInstance.getFirstAsync<{ count: number }>(
              'SELECT COUNT(*) as count FROM template_relations WHERE parent_id IS ?',
              [parentId]);
            position = result?.count || 0;
          }
        } else {
          while (levelsOffset < 0 && parentId) {
            target = await dbInstance.getFirstAsync<TaskTemplateRelation>(
              'SELECT * FROM template_relations WHERE child_id = ?',
              [parentId]
            );
            levelsOffset++;
            if (!target) {
              throw new Error('Database corrupted, parentId points at a nonexistent target');
            }
            parentId = target.parent_id;
            position = target.position + 1;
          }
        }
      }

      await dbInstance.runAsync(
        'UPDATE template_relations SET position = position + 1 WHERE parent_id IS ? and position >= ?',
        [parentId, position]
      );
      await dbInstance.runAsync(
        'UPDATE template_relations SET expanded = 1 WHERE child_id IS ?',
        [parentId]
      );
      await dbInstance.runAsync(
        'UPDATE template_relations SET parent_id = ?, position = ? WHERE id = ?',
        [parentId, position, relId]
      );
      await dbInstance.runAsync(
        'UPDATE template_relations SET position = position - 1 WHERE parent_id IS ? and position > ?',
        [relation.parent_id, relation.position]
      );


      // delete all tasks where rel.parent.id==task.parent.template_id && rel.child_id==task.template_id
      if (relation.parent_id) {
        const parents = await dbInstance.getAllAsync<TaskInstance>(
          'SELECT * FROM tasks WHERE template_id = ? and completed = 0', [relation.parent_id]);
        for (const parent of parents) {
          const tasks = await dbInstance.getAllAsync<TaskInstance>(
            'SELECT * FROM tasks WHERE template_id = ? AND parent_id IS ? AND completed = 0', [relation.child_id, parent.id]);
            for (const task of tasks) {
              database.deleteTask(task.id);
            }
        }

      }
       // check if there are tasks we need to add this to as well
      if (parentId) {
        const tasks = await dbInstance.getAllAsync<TaskInstance>('SELECT * FROM tasks WHERE template_id = ? and completed = 0', [parentId]);
        for (const task of tasks) {
          database.createTaskFromTemplate(relation.child_id, task.id, position);
        }
      }

    } catch (error) {
      console.error('Error moving template:', error);
      throw error;
    }
  },

  // TODO if template has parent and there is a task that correlates to parent, then update task
  // Template functions// Create a template (optionally under a parent template)
  createTemplate: async (template: AddTemplateParams): Promise<string> => {
    try {
      const dbInstance = await db;
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await dbInstance.runAsync(
        'INSERT INTO templates (id, title) VALUES (?, ?)',
        [id, template.title.trim()]
      );

      // If this template has a parent, create the relation
      let position = 0;
      const existingRelation = await dbInstance.getFirstAsync<TaskTemplateRelation>(
        'SELECT * FROM template_relations WHERE child_id IS ? AND parent_id IS ?',
        [template.after_id ?? null, template.parent_id ?? null]);
      if (existingRelation) {
        position = existingRelation.position + 1;
        await dbInstance.runAsync('UPDATE template_relations SET position = position + 1 WHERE parent_id IS ? AND position > ?',
          [template.parent_id ?? null, existingRelation.position]);
      } else {
        const result = await dbInstance.getFirstAsync<{ position: number }>(
          'SELECT COALESCE(MAX(position) + 1, 0) as position FROM template_relations WHERE parent_id IS ?',
          [template.parent_id ?? null]);
        position = result?.position ?? 0;
      }

      const relId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await dbInstance.runAsync(
        'INSERT INTO template_relations (id, parent_id, child_id, position, expanded) VALUES (?, ?, ?, ?, ?)',
        [relId, template.parent_id || null, id, position, template.expanded?true:false]
      );

      if (template.parent_id) {
        // check if there are tasks we need to add this to as well
        const tasks = await dbInstance.getAllAsync<TaskInstance>('SELECT * FROM tasks WHERE template_id = ? and completed = 0', [template.parent_id]);
        for (const task of tasks) {
          database.createTaskFromTemplate(id, task.id, position);
        }
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
          ORDER BY position ASC
      `);

      return { templates, relations };
    } catch (error) {
      console.error('Error getting template hierarchy:', error);
      throw error;
    }
  },

  // Get root templates (templates with null parent_id)
  getRootTemplates: async (): Promise<TaskTemplate[]> => {
    try {
      const dbInstance = await db;
      return await dbInstance.getAllAsync<TaskTemplate>(`
          SELECT t.*
          FROM templates t
          LEFT JOIN template_relations tr ON t.id = tr.child_id
          WHERE tr.parent_id IS NULL OR tr.id IS NULL
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
                   INNER JOIN template_relations r ON t.id = r.child_id
          WHERE r.parent_id = ?
          ORDER BY r.position ASC
      `, [templateId]);

      return result;
    } catch (error) {
      console.error('Error getting template children:', error);
      throw error;
    }
  },

  // Create task instance from template (with full hierarchy)
  createTaskFromTemplate: async (templateId: string, parentInstanceId: string | null = null, position?: number): Promise<string> => {
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
      position = position||0;

      await dbInstance.runAsync('UPDATE tasks SET position = position + 1 WHERE parent_id IS ? AND position >= ?',
        [parentInstanceId, position]);
      await dbInstance.runAsync(
        `INSERT INTO tasks (id, template_id, parent_id, title, completed, position)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [taskId, templateId, parentInstanceId, template.title, 0, position||0] // completed=0 = bound to template
      );

      // Recursively create tasks from template children
      const childTemplates = await dbInstance.getAllAsync<TaskTemplateRelation>(`
          SELECT *
          FROM template_relations r
          WHERE r.parent_id = ?
          ORDER BY r.position ASC
      `, [templateId]);

      for (const childTemplate of childTemplates) {
        await database.createTaskFromTemplate(childTemplate.child_id, taskId, childTemplate.position);
      }

      return taskId;
    } catch (error) {
      console.error('Error creating task from template:', error);
      throw error;
    }
  },

  // ParentInstanceId should always be null
  createTemplateFromTask: async (taskId: string, parentInstanceId: string | null = null): Promise<string> => {
    try {
      const dbInstance = await db;
      const task = await dbInstance.getFirstAsync<TaskInstance>('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!task) {
        throw new Error('Task not found');
      }
      // Create the template from task
      const templateId = await database.createTemplate({ title: task.title, parent_id: parentInstanceId, completed: false, expanded: false });
      // Recursively create templates from task children
      const childTasks = await dbInstance.getAllAsync<TaskInstance>('SELECT * FROM tasks WHERE parent_id = ?', [taskId]);
      for (const childTask of childTasks) {
        await database.createTemplateFromTask(childTask.id, templateId);
      }
      await dbInstance.runAsync('UPDATE tasks SET template_id = ? WHERE id IS ?',
        [templateId, taskId]);
      return templateId;
    } catch (error) {
      console.error('Error creating template from task:', error);
      throw error;
    }
  },

  // update tasks
  // Update template title and structure
  updateTemplate: async (templateId: string, newTitle: string, newChildren: string[]): Promise<void> => {
    try {
      // Update template title
      const dbInstance = await db;
      await dbInstance.runAsync(
        'UPDATE templates SET title = ? WHERE id = ?',
        [newTitle.trim(), templateId]
      );
      await dbInstance.runAsync(
        'UPDATE tasks SET title = ? WHERE template_id = ? AND completed = 0',
        [newTitle.trim(), templateId]
      );

      // Get current children
      if (newChildren) { //TODO: fix issues where newChildren are undefined
        const currentChildren = await dbInstance.getAllAsync<{ child_id: string }>(
          'SELECT child_id FROM template_relations WHERE parent_id = ?',
          [templateId]
        );
        const currentChildIds = currentChildren.map(c => c.child_id);

        // Find children to remove
        const childrenToRemove = currentChildIds.filter(id => !newChildren.includes(id));
        for (const childId of childrenToRemove) {
          await dbInstance.runAsync(
            'DELETE FROM template_relations WHERE parent_id = ? AND child_id = ?',
            [templateId, childId]
          );
        }

        // Find children to add
        const childrenToAdd = newChildren.filter(id => !currentChildIds.includes(id));
        for (let i = 0; i < childrenToAdd.length; i++) {
          await dbInstance.runAsync(
            'INSERT INTO template_relations (parent_id, child_id, position) VALUES (?, ?, ?, ?)',
            [templateId, childrenToAdd[i], i]
          );
        }

        // Update sort order for existing children
        for (let idx = 0; idx < newChildren.length; idx++) {
          if (currentChildIds.includes(newChildren[idx])) {
            await dbInstance.runAsync(
              'UPDATE template_relations SET position = ? WHERE parent_id = ? AND child_id = ?',
              [idx, templateId, newChildren[idx]]
            );
          }
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

  // update tasks
  // Remove template from parent, delete template if it is now an orphan
  removeTemplate: async (parentId: string | null, id: string): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.runAsync(
        'DELETE FROM template_relations WHERE parent_id IS ? AND child_id IS ?',
        [parentId, id]
      );

      const parents = await dbInstance.getAllAsync<TaskInstance>(
        'SELECT * FROM tasks WHERE template_id = ? and completed = 0', [parentId]);
      for (const parent of parents) {
        const tasks = await dbInstance.getAllAsync<TaskInstance>(
          'SELECT * FROM tasks WHERE template_id = ? AND parent_id IS ? AND completed = 0', [id, parent.id]);
          for (const task of tasks) {
            database.deleteTask(task.id);
          }
      }
      
      // Check if template is now an orphan
      const result = await dbInstance.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM template_relations WHERE child_id = ?',
        [id]
      );

      if (!result?.count) {
        const children = await database.getTemplateChildren(id);
        for (const child of children) {
          await database.removeTemplate(id, child.id);
        }
        await database.deleteTemplate(id);
      }
    } catch (error) {
      console.error('Error removing template from parent:', error);
      throw error;
    }
  },
  // update tasks
  // Delete template and its relations
  deleteTemplate: async (id: string): Promise<void> => {
    try {
      // First delete any relations involving this template
      const dbInstance = await db;
      await dbInstance.runAsync(`
          DELETE
          FROM template_relations
          WHERE parent_id = ?
             OR child_id = ?
      `, [id, id]);

      // Then delete the template itself
      await dbInstance.runAsync('DELETE FROM templates WHERE id = ?', [id]);
      await dbInstance.runAsync('DELETE FROM tasks WHERE template_id = ? AND completed = 0', [id]);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  // Add template relation (for building hierarchies)
  addTemplateRelation: async (parentTemplateId: string, childTemplateId: string, position: number = 0): Promise<void> => {
    try {
      const dbInstance = await db;
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await dbInstance.runAsync(
        'INSERT INTO template_relations (id, parent_id, child_id, position) VALUES (?, ?, ?, ?)',
        [id, parentTemplateId, childTemplateId, position]
      );
    } catch (error) {
      console.error('Error adding template relation:', error);
      throw error;
    }
  },

  replaceTemplate: async (parentId: string, oldId: string, newId: string): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.runAsync('UPDATE template_relations SET child_id = ? WHERE parent_id IS ? AND child_id IS ?',
        [newId, parentId, oldId]);

      const result = await dbInstance.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM template_relations WHERE child_id = ? OR parent_id = ?',
        [oldId, oldId]
      );


      // delete all tasks where rel.parent.id==task.parent.template_id && rel.child_id==task.template_id
      const parents = await dbInstance.getAllAsync<TaskInstance>(
        'SELECT * FROM tasks WHERE template_id = ? and completed = 0', [parentId]);
      for (const parent of parents) {
        const tasks = await dbInstance.getAllAsync<TaskInstance>(
          'SELECT * FROM tasks WHERE template_id = ? AND parent_id IS ? AND completed = 0', [oldId, parent.id]);
          for (const task of tasks) {
            database.deleteTask(task.id);
          }
      }

       // check if there are tasks we need to add this to as well
       const position = await dbInstance.getFirstAsync<number>('select position FROM template_relations WHERE parent_id IS ? AND child_id IS ?', [parentId, newId]);
      if (parentId) {
        const tasks = await dbInstance.getAllAsync<TaskInstance>('SELECT * FROM tasks WHERE template_id = ? and completed = 0', [parentId]);
        for (const task of tasks) {
          database.createTaskFromTemplate(newId, task.id, position||0);
        }
      }


      if (!result?.count) {
        await database.deleteTemplate(oldId);
      }
    } catch (error) {
      console.error('Error replacing template:', error);
      throw error;
    }
  },

  replaceTaskWithTemplate: async (taskId: string, templateId: string): Promise<void> => {
    try {
      const dbInstance = await db;

      // Ensure template exists
      const template = await dbInstance.getFirstAsync<TaskTemplate>('SELECT * FROM templates WHERE id = ?', [templateId]);
      if (!template) throw new Error('Template not found');

      // Ensure task exists
      const existingTask = await dbInstance.getFirstAsync<TaskInstance>('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (!existingTask) throw new Error('Task to replace not found');

      // Update the task to bind it to the template (keep its parent/position)
      await dbInstance.runAsync(
        'UPDATE tasks SET template_id = ?, title = ?, completed = ? WHERE id = ?',
        [templateId, template.title, 0, taskId]
      );

      // Delete all descendants of the task (but not the task itself)
      await dbInstance.runAsync(`
          WITH RECURSIVE descendants AS (SELECT id
                                         FROM tasks
                                         WHERE parent_id = ?
                                         UNION ALL
                                         SELECT t.id
                                         FROM tasks t
                                                  JOIN descendants d ON t.parent_id = d.id)
          DELETE
          FROM tasks
          WHERE id IN (SELECT id FROM descendants)
      `, [taskId]);

      // Recursive helper to create children from template children
      const createChildrenFromTemplate = async (parentTemplateId: string, parentTaskId: string) => {
        const childTemplates = await dbInstance.getAllAsync<TaskTemplate>(`
            SELECT t.*
            FROM templates t
                     INNER JOIN template_relations r ON t.id = r.child_id
            WHERE r.parent_id = ?
            ORDER BY r.position ASC
        `, [parentTemplateId]);

        for (let idx = 0; idx < childTemplates.length; idx++) {
          const childTemplate = childTemplates[idx];
          const childTaskId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

          await dbInstance.runAsync(
            `INSERT INTO tasks (id, template_id, parent_id, title, completed, position)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [childTaskId, childTemplate.id, parentTaskId, childTemplate.title, 0, idx]
          );

          // Recurse for grandchildren
          await createChildrenFromTemplate(childTemplate.id, childTaskId);
        }
      };

      // Create children of the provided template under the existing task
      await createChildrenFromTemplate(templateId, taskId);
    } catch (error) {
      console.error('Error replacing task with template', error);
      throw error;
    }
    // },
  },

  toggleTaskExpand: async (id: string): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.runAsync(
        'UPDATE tasks SET expanded = NOT expanded WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error updating task title:', error);
      throw error;
    }
  },
  toggleTemplateExpand: async (parentId: string | null, id: string): Promise<void> => {
    try {
      const dbInstance = await db;
      const test = await dbInstance.runAsync(
        'UPDATE template_relations SET expanded = NOT expanded WHERE parent_id IS ? AND child_id = ?',
        [parentId, id]
      );
    } catch (error) {
      console.error('Error updating task title:', error);
      throw error;
    }
  },
  clearDatabase: async (): Promise<void> => {
    try {
      const dbInstance = await db;
      await dbInstance.execAsync('DELETE FROM tasks;');
      await dbInstance.execAsync('DELETE FROM templates;');
      await dbInstance.execAsync('DELETE FROM template_relations;');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  },
  saveTasks: async (tasks: TaskInstance[]): Promise<void> => {
    if (!tasks || tasks.length === 0) return;
    try {
      // Begin a transaction for efficiency
      const dbInstance = await db;
      for (const task of tasks) {
        await dbInstance.runAsync(
          `
          INSERT OR REPLACE INTO tasks (
            id,
            template_id,
            parent_id,
            title,
            expanded,
            completed,
            completed_at,
            due_date,
            recurrence_rule,
            position,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            task.id,
            task.template_id,
            task.parent_id,
            task.title,
            task.expanded ? 1 : 0,
            task.completed ? 1 : 0,
            task.completed_at ?? null,
            task.due_date ?? null,
            task.recurrence_rule ?? null,
            task.position ?? 0,
            task.created_at ?? new Date().toISOString(),
            task.updated_at ?? new Date().toISOString(),
          ]
        );
      }
    } catch (err) {
      console.error("❌ Failed to save tasks:", err);
      throw err;
    }
  },
  saveTemplates: async (templates: TaskTemplate[]): Promise<void> => {
    if (!templates || templates.length === 0) return;
    try {
      const dbInstance = await db;
      for (const template of templates) {
        await dbInstance.runAsync(
          `
          INSERT OR REPLACE INTO templates (
            id,
            title,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?)
          `,
          [
            template.id,
            template.title,
            template.created_at ?? new Date().toISOString(),
            template.updated_at ?? new Date().toISOString(),
          ]
        );
      }
    } catch (error) {
      console.error("❌ Failed to save templates:", error);
      throw error;
    }

  },
  saveRelations: async (relations: TaskTemplateRelation[]): Promise<void> => {
    if (!relations || relations.length === 0) return;
    try {
      const dbInstance = await db;
      for (const relation of relations) {
        await dbInstance.runAsync(
          `
          INSERT OR REPLACE INTO template_relations (
            id,
            parent_id,
            child_id,
            position,
            expanded,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            relation.id,
            relation.parent_id,
            relation.child_id,
            relation.position ?? 0,
            relation.expanded ? 1 : 0,
            relation.created_at ?? new Date().toISOString(),
            relation.updated_at ?? new Date().toISOString(),
          ]
        );
      }
    } catch (error) {
      console.error("❌ Failed to save relations:", error);
      throw error;
    }

  },
};