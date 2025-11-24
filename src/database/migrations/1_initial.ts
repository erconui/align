export const version = 1;
import { SQLiteDatabase } from "expo-sqlite";

export async function up(tx: SQLiteDatabase) {
  await tx.execAsync(`
    CREATE TABLE IF NOT EXISTS templates
    (
        id    TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await tx.execAsync(`
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
  
  await tx.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks
    (
        id               TEXT PRIMARY KEY,
        template_id      TEXT,
        parent_id        TEXT,
        title            TEXT    NOT NULL,
        expanded         BOOLEAN NOT NULL DEFAULT 0,
        completed        BOOLEAN NOT NULL DEFAULT 0,
        completed_at     DATETIME,
        due_date         DATETIME,
        recurrence_rule  TEXT,
        private          BOOLEAN NOT NULL DEFAULT 0,
        position         INTEGER NOT NULL DEFAULT 0,
        created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES templates (id),
        FOREIGN KEY (parent_id) REFERENCES tasks (id)
    );
  `);
  await tx.execAsync(`
    CREATE TRIGGER IF NOT EXISTS update_template_updated_at 
      AFTER UPDATE ON templates
      BEGIN
        UPDATE templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;`
  );

  await tx.execAsync(`
    CREATE TRIGGER IF NOT EXISTS update_template_relation_updated_at 
      AFTER UPDATE ON template_relations
      BEGIN
        UPDATE template_relations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;`
  );

  await tx.execAsync(`
    CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
      AFTER UPDATE ON tasks
      BEGIN
        UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;`
  );

  await tx.execAsync(`
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
}