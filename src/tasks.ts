import { Elysia, t } from 'elysia';
import { db } from './db';
import { tasks } from './db/schema';
import { eq, and, like, count } from 'drizzle-orm';
import { baseAuth } from './auth';

export const tasksPlugin = new Elysia()
  .use(baseAuth)
  .group('/api', (app) => 
    app.guard({
      beforeHandle({ user, set }: any) {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
      },
    }, (app) => 
      app
        .post(
          '/tasks',
          async ({ body, user }: any) => {
            const { title, description } = body;
            
            const [result] = await db.insert(tasks).values({
              title,
              description,
              userId: user!.id,
            });

            return { 
              id: result.insertId, 
              message: 'Task created successfully' 
            };
          },
          {
            body: t.Object({
              title: t.String(),
              description: t.Optional(t.String()),
            }),
          }
        )
        .get(
          '/tasks', 
          async ({ user, query }: any) => {
            const { page = 1, limit = 10, isCompleted, search } = query;
            const offset = (page - 1) * limit;

            const whereConditions = [eq(tasks.userId, user!.id)];

            if (isCompleted !== undefined) {
              whereConditions.push(eq(tasks.isCompleted, isCompleted));
            }

            if (search) {
              whereConditions.push(like(tasks.title, `%${search}%`));
            }

            const finalWhere = and(...whereConditions);

            const [totalCountResult] = await db
              .select({ count: count() })
              .from(tasks)
              .where(finalWhere);

            const data = await db
              .select()
              .from(tasks)
              .where(finalWhere)
              .limit(limit)
              .offset(offset);

            const total = totalCountResult?.count || 0;
            const totalPages = Math.ceil(total / limit);

            return {
              data,
              meta: {
                total,
                totalPages,
                page,
                limit,
              },
            };
          },
          {
            query: t.Object({
              page: t.Optional(t.Numeric({ minimum: 1 })),
              limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
              isCompleted: t.Optional(t.Boolean()),
              search: t.Optional(t.String()),
            }),
          }
        )
        .patch(
          '/tasks/:id',
          async ({ params: { id }, body, user, set }: any) => {
            const taskId = Number(id);
            
            const [task] = await db
              .select()
              .from(tasks)
              .where(and(eq(tasks.id, taskId), eq(tasks.userId, user!.id)));

            if (!task) {
              set.status = 404;
              return { error: 'Task not found' };
            }

            await db
              .update(tasks)
              .set({
                ...body,
                updatedAt: new Date(),
              })
              .where(eq(tasks.id, taskId));

            return { message: 'Task updated successfully' };
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: t.Object({
              title: t.Optional(t.String()),
              description: t.Optional(t.String()),
              isCompleted: t.Optional(t.Boolean()),
            }),
          }
        )
        .delete('/tasks/:id', async ({ params: { id }, user, set }: any) => {
          const taskId = Number(id);
          
          const [task] = await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, user!.id)));

          if (!task) {
            set.status = 404;
            return { error: 'Task not found' };
          }

          await db.delete(tasks).where(eq(tasks.id, taskId));

          return { message: 'Task deleted successfully' };
        })
    )
  );
