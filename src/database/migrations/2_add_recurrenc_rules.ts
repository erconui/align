export const version = 2;
import { SQLiteDatabase } from "expo-sqlite";
interface TaskInstance {
  id: string;
  template_id: string | null;
  parent_id: string | null;
  title: string;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  recurrence_rule: string | null;
  position: number;
  expanded: boolean;
  private: boolean;
}
interface RecurrenceRule {
  type: "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval?: number;
  by_day?: number[];
  skipIfMissed?: boolean;
  endType: "never" | "on" | "after";
  endDate: Date | null;
  occurrences: number;
}
export async function up(tx: SQLiteDatabase) {
  await tx.runAsync(`DROP TABLE IF EXISTS recurrence_rules `);
  
  await tx.runAsync(`
    CREATE TABLE recurrence_rules (
      id TEXT PRIMARY KEY,

      frequency TEXT NOT NULL DEFAULT 'none',             -- 'none', 'daily', 'weekly', 'monthly', 'yearly'
      interval INTEGER DEFAULT 1,          -- every X days/weeks/months
      end_type TEXT NOT NULL,              -- 'never', 'on_date', 'after_occurrences'

      end_date DATETIME,                    -- used if end_type = 'on_date'
      occurrences INTEGER,                 -- used if end_type = 'after_occurrences'

      -- WEEKLY: comma-separated weekday list ('MON,WED,FRI')
      -- MONTHLY: day_of_month; or NULL if by_pos or more advanced rule
      by_day TEXT,                         -- for weekly patterns
      by_month_day INTEGER,                 -- for monthly patterns
      skip_if_missed  BOOLEAN NOT NULL DEFAULT 0 
    );
  `);

  await tx.runAsync(`
    ALTER TABLE tasks
      ADD COLUMN recurrence_rule_id INTEGER REFERENCES recurrence_rules(id)
  `);

  const tasksWithRule: TaskInstance[] = await tx.getAllAsync(`SELECT id, recurrence_rule FROM tasks WHERE recurrence_rule IS NOT NULL`);

  for (const task of tasksWithRule) {
    const rule : RecurrenceRule = JSON.parse(task.recurrence_rule!);
    if (rule.endDate) {
      rule.endDate = new Date(rule.endDate);
    }

    // 3. Insert into recurrence_rules
    const result = await tx.runAsync(
      `INSERT INTO recurrence_rules
        (frequency, interval, by_day, skip_if_missed, end_type, end_date, occurrences)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.type || null,
        rule.interval || 1,
        rule.by_day ? rule.by_day.join(',') : null,
        rule.skipIfMissed || false,
        rule.endType || 'never',
        rule.endDate?.getMilliseconds() || null,
        rule.occurrences || null
      ]
    );

    // 4. Update task to reference new recurrence_rule
    await tx.runAsync(
      `UPDATE tasks
       SET recurrence_rule_id = ?
       WHERE id = ?`,
      [result.lastInsertRowId, task.id]
    );
  }
}