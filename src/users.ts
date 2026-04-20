import { Elysia, t } from 'elysia';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { baseAuth } from './auth';

export const usersPlugin = new Elysia()
  .use(baseAuth)
  .group('/api/users', (app) =>
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
          .get('/profile', async ({ user }: any) => {
            return {
              id: user!.id,
              name: user!.name,
              email: user!.email,
              createdAt: user!.createdAt,
            };
          })
          .put(
            '/profile',
            async ({ body, user, set }: any) => {
              const { name } = body;

              const [existing] = await db
                .select()
                .from(users)
                .where(eq(users.id, user!.id));

              if (!existing) {
                set.status = 404;
                return { error: 'User not found' };
              }

              await db
                .update(users)
                .set({ name })
                .where(eq(users.id, user!.id));

              return { message: 'Profile updated successfully' };
            },
            {
              body: t.Object({
                name: t.String({ minLength: 1, maxLength: 255 }),
              }),
            }
          )
    )
  );
