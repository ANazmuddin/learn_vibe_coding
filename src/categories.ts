import { Elysia, t } from 'elysia';
import { db } from './db';
import { categories } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { baseAuth } from './auth';

export const categoriesPlugin = new Elysia()
  .use(baseAuth)
  .group('/api', (app) =>
    app.guard(
      {
        beforeHandle({ user, set }: any) {
          if (!user) {
            set.status = 401;
            return { error: 'Unauthorized' };
          }
        },
      },
      (app) =>
        app
          .post(
            '/categories',
            async ({ body, user }: any) => {
              const { name } = body;

              const [result] = await db.insert(categories).values({
                name,
                userId: user!.id,
              });

              return {
                id: result.insertId,
                message: 'Category created successfully',
              };
            },
            {
              body: t.Object({
                name: t.String({ minLength: 1, maxLength: 100 }),
              }),
            }
          )
          .get('/categories', async ({ user }: any) => {
            const data = await db
              .select()
              .from(categories)
              .where(eq(categories.userId, user!.id));

            return { data };
          })
          .patch(
            '/categories/:id',
            async ({ params: { id }, body, user, set }: any) => {
              const categoryId = Number(id);

              const [category] = await db
                .select()
                .from(categories)
                .where(
                  and(
                    eq(categories.id, categoryId),
                    eq(categories.userId, user!.id)
                  )
                );

              if (!category) {
                set.status = 404;
                return { error: 'Category not found' };
              }

              await db
                .update(categories)
                .set({ name: body.name })
                .where(eq(categories.id, categoryId));

              return { message: 'Category updated successfully' };
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                name: t.String({ minLength: 1, maxLength: 100 }),
              }),
            }
          )
          .delete(
            '/categories/:id',
            async ({ params: { id }, user, set }: any) => {
              const categoryId = Number(id);

              const [category] = await db
                .select()
                .from(categories)
                .where(
                  and(
                    eq(categories.id, categoryId),
                    eq(categories.userId, user!.id)
                  )
                );

              if (!category) {
                set.status = 404;
                return { error: 'Category not found' };
              }

              await db
                .delete(categories)
                .where(eq(categories.id, categoryId));

              return { message: 'Category deleted successfully' };
            },
            {
              params: t.Object({ id: t.String() }),
            }
          )
    )
  );
