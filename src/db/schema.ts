import { mysqlTable, varchar, timestamp, boolean, bigint } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
});

export const categories = mysqlTable('categories', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = mysqlTable('tasks', {
  id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  isCompleted: boolean('is_completed').notNull().default(false),
  categoryId: bigint('category_id', { mode: 'number', unsigned: true }).references(() => categories.id),
  dueDate: timestamp('due_date'),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
