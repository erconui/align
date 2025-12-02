export const version = 3;
import { SQLiteDatabase } from "expo-sqlite";

export async function up(tx: SQLiteDatabase) {
  await tx.runAsync(`
    ALTER TABLE templates
      ADD COLUMN private BOOLEAN not null default 0
  `);
}