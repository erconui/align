import * as SQLite from 'expo-sqlite';
import {TaskInstance} from '../types';

// Open database with async API
const db = SQLite.openDatabaseAsync('tasks.db');

export const initDatabase = async (): Promise<void> => {
  try {
    const database = await db;

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS template_relations (
        id TEXT PRIMARY KEY,
        parent_template_id TEXT NOT NULL,
        child_template_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY (parent_template_id) REFERENCES templates (id),
        FOREIGN KEY (child_template_id) REFERENCES templates (id)
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        template_id TEXT,
        parent_id TEXT,
        title TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0,
--         due_date DATETIME,
--         recurrence_rule TEXT,
--         completed_at DATETIME,
        sort_order INTEGER NOT NULL DEFAULT 0,
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
      const database = await db;
      return await database.getAllAsync<TaskInstance>(
          `SELECT * FROM tasks
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
      const database = await db;
      const result = await database.getAllAsync<TaskInstance>(
          `SELECT * FROM tasks 
         ORDER BY sort_order ASC`
      );
      return result;
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  },

  // Add a new task
  addTask: async (task: Omit<TaskInstance, 'id'>): Promise<string> => {
    try {
      const database = await db;
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      await database.runAsync(
        `INSERT INTO tasks 
         (id, template_id, parent_id, title, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          task.template_id || null,
          task.parent_id || null,
          task.title,
          task.completed ? 1 : 0,
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
      const result = await database.runAsync(
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

  // Delete a task
  deleteTask: async (id: string): Promise<void> => {
    try {
      const database = await db;
      await database.runAsync(`
        WITH RECURSIVE descendants AS (
          SELECT id FROM tasks WHERE id = ?
          UNION ALL
          SELECT t.id FROM tasks t
          JOIN descendants d ON t.parent_id = d.id
        )
        DELETE FROM tasks WHERE id IN (SELECT id FROM descendants)
      `, [id]);
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
        'UPDATE tasks SET title = ? WHERE id = ?',
        [title, id]
      );
    } catch (error) {
      console.error('Error updating task title:', error);
      throw error;
    }
  },
};