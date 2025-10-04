// import * as SQLite from 'expo-sqlite';
// import { TaskInstance, TaskTemplate, TaskTemplateRelation } from '../types';
//
// // Open database with async API
// const db = SQLite.openDatabaseAsync('tasks.db');
//
// export const initDatabase = async (): Promise<void> => {
//   try {
//     const database = await db;
//
//     await database.execAsync(`
//       CREATE TABLE IF NOT EXISTS task_templates (
//         id TEXT PRIMARY KEY,
//         title TEXT NOT NULL,
//         is_complex BOOLEAN NOT NULL DEFAULT 0,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
//       );
//     `);
//
//     await database.execAsync(`
//       CREATE TABLE IF NOT EXISTS task_template_relations (
//         id TEXT PRIMARY KEY,
//         parent_template_id TEXT NOT NULL,
//         child_template_id TEXT NOT NULL,
//         sort_order INTEGER NOT NULL,
//         FOREIGN KEY (parent_template_id) REFERENCES task_templates (id),
//         FOREIGN KEY (child_template_id) REFERENCES task_templates (id)
//       );
//     `);
//
//     await database.execAsync(`
//       CREATE TABLE IF NOT EXISTS task_instances (
//         id TEXT PRIMARY KEY,
//         template_id TEXT,
//         parent_instance_id TEXT,
//         title TEXT NOT NULL,
//         is_completed BOOLEAN NOT NULL DEFAULT 0,
//         due_date DATETIME,
//         recurrence_rule TEXT,
//         completed_at DATETIME,
//         sort_order INTEGER NOT NULL DEFAULT 0,
//         FOREIGN KEY (template_id) REFERENCES task_templates (id),
//         FOREIGN KEY (parent_instance_id) REFERENCES task_instances (id)
//       );
//     `);
//
//     console.log('Database initialized successfully');
//   } catch (error) {
//     console.error('Database initialization error:', error);
//     throw error;
//   }
// };
//
// // Database operations
// export const database = {
//   // Get all root tasks (tasks without parents)
//   getRootTasks: async (): Promise<TaskInstance[]> => {
//     try {
//       const database = await db;
//       const result = await database.getAllAsync<TaskInstance>(
//         `SELECT * FROM task_instances
//          WHERE parent_instance_id IS NULL
//          ORDER BY sort_order ASC, created_at DESC`
//       );
//       return result;
//     } catch (error) {
//       console.error('Error getting root tasks:', error);
//       throw error;
//     }
//   },
//
//   // Add a new task
//   addTask: async (task: Omit<TaskInstance, 'id'>): Promise<string> => {
//     try {
//       const database = await db;
//       const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
//
//       await database.runAsync(
//         `INSERT INTO task_instances
//          (id, template_id, parent_instance_id, title, is_completed, due_date, recurrence_rule, completed_at, sort_order)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           id,
//           task.template_id || null,
//           task.parent_instance_id || null,
//           task.title,
//           task.is_completed ? 1 : 0,
//           task.due_date || null,
//           task.recurrence_rule || null,
//           task.completed_at || null,
//           task.sort_order || 0,
//         ]
//       );
//
//       return id;
//     } catch (error) {
//       console.error('Error adding task:', error);
//       throw error;
//     }
//   },
//
//   // Update task completion status
//   toggleTask: async (id: string, isCompleted: boolean): Promise<void> => {
//     try {
//       const database = await db;
//       await database.runAsync(
//         `UPDATE task_instances
//          SET is_completed = ?, completed_at = ?
//          WHERE id = ?`,
//         [
//           isCompleted ? 1 : 0,
//           isCompleted ? new Date().toISOString() : null,
//           id
//         ]
//       );
//     } catch (error) {
//       console.error('Error toggling task:', error);
//       throw error;
//     }
//   },
//
//   // Delete a task
//   deleteTask: async (id: string): Promise<void> => {
//     try {
//       const database = await db;
//       await database.runAsync(
//         'DELETE FROM task_instances WHERE id = ?',
//         [id]
//       );
//     } catch (error) {
//       console.error('Error deleting task:', error);
//       throw error;
//     }
//   },
//
//   // Update task title
//   updateTaskTitle: async (id: string, title: string): Promise<void> => {
//     try {
//       const database = await db;
//       await database.runAsync(
//         'UPDATE task_instances SET title = ? WHERE id = ?',
//         [title, id]
//       );
//     } catch (error) {
//       console.error('Error updating task title:', error);
//       throw error;
//     }
//   },
// };
import * as SQLite from 'expo-sqlite';
import { TaskInstance, TaskTemplate, TaskTemplateRelation } from '../types';

// Open database with async API
const db = SQLite.openDatabaseAsync('tasks.db');

export const initDatabase = async (): Promise<void> => {
  try {
    const database = await db;

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS task_templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        is_complex BOOLEAN NOT NULL DEFAULT 0
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS task_template_relations (
        id TEXT PRIMARY KEY,
        parent_template_id TEXT NOT NULL,
        child_template_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY (parent_template_id) REFERENCES task_templates (id),
        FOREIGN KEY (child_template_id) REFERENCES task_templates (id)
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS task_instances (
        id TEXT PRIMARY KEY,
        template_id TEXT,
        parent_instance_id TEXT,
        title TEXT NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT 0,
        due_date DATETIME,
        recurrence_rule TEXT,
        completed_at DATETIME,
        sort_order INTEGER NOT NULL DEFAULT 0,
--         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES task_templates (id),
        FOREIGN KEY (parent_instance_id) REFERENCES task_instances (id)
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
      const database = await db;
      const result = await database.getAllAsync<TaskInstance>(
        `SELECT * FROM task_instances 
         WHERE parent_instance_id IS NULL 
         ORDER BY sort_order ASC`
      );
      return result;
    } catch (error) {
      console.error('Error getting root tasks:', error);
      throw error;
    }
  },

  // Add a new task
  addTask: async (task: Omit<TaskInstance, 'id'>): Promise<string> => {
    try {
      const database = await db;
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      await database.runAsync(
        `INSERT INTO task_instances 
         (id, template_id, parent_instance_id, title, is_completed, due_date, recurrence_rule, completed_at, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          task.template_id || null,
          task.parent_instance_id || null,
          task.title,
          task.is_completed ? 1 : 0,
          task.due_date || null,
          task.recurrence_rule || null,
          task.completed_at || null,
          task.sort_order || 0,
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
      const database = await db;
      await database.runAsync(
        `UPDATE task_instances 
         SET is_completed = ?, completed_at = ? 
         WHERE id = ?`,
        [
          isCompleted ? 1 : 0,
          isCompleted ? new Date().toISOString() : null,
          id
        ]
      );
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (id: string): Promise<void> => {
    try {
      const database = await db;
      await database.runAsync(
        'DELETE FROM task_instances WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Update task title
  updateTaskTitle: async (id: string, title: string): Promise<void> => {
    try {
      const database = await db;
      await database.runAsync(
        'UPDATE task_instances SET title = ? WHERE id = ?',
        [title, id]
      );
    } catch (error) {
      console.error('Error updating task title:', error);
      throw error;
    }
  },
};