export const version = 4;
import { SQLiteDatabase } from "expo-sqlite";

export async function up(tx: SQLiteDatabase) {
  await tx.runAsync(`
    ALTER TABLE tasks
      ADD COLUMN backlog BOOLEAN not null default 0
  `);
  await tx.runAsync(`
    ALTER TABLE tasks
      ADD COLUMN labels TEXT
  `);
}