import { Elysia, t } from 'elysia';
import { db } from './db';
import { tasks } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { baseAuth } from './auth';

export const tasksPlugin = new Elysia()
  .use(baseAuth)
  .group('/api', (app) => 
    app.guard({
      beforeHandle({ user, set }) {
        if (!user) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
      },
    }, (app) => 
      app
        .post(
          '/tasks',
          async ({ body, user }) => {
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
        .get('/tasks', async ({ user }) => {
          return await db.select().from(tasks).where(eq(tasks.userId, user!.id));
        })
        .patch(
          '/tasks/:id',
          async ({ params: { id }, body, user, set }) => {
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
        .delete('/tasks/:id', async ({ params: { id }, user, set }) => {
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
