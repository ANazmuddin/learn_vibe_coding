import { Elysia, t } from 'elysia';
import { db } from './db';
import { users, sessions } from './db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const auth = new Elysia({ prefix: '/api' })
  .post(
    '/register',
    async ({ body, set }) => {
      const { name, email, password } = body;

      const hashedPassword = await Bun.password.hash(password);

      try {
        await db.insert(users).values({
          name,
          email,
          password: hashedPassword,
        });
        return { message: 'User registered successfully' };
      } catch (e) {
        set.status = 400;
        return { error: 'User already exists or invalid data' };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .post(
    '/login',
    async ({ body, set, cookie: { session } }) => {
      const { email, password } = body;

      const [user] = await db.select().from(users).where(eq(users.email, email));

      if (!user || !(await Bun.password.verify(password, user.password))) {
        set.status = 401;
        return { error: 'Invalid email or password' };
      }

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(sessions).values({
        id: sessionToken,
        userId: user.id,
        expiresAt,
      });

      if (session) {
        session.value = sessionToken;
        session.expires = expiresAt;
        session.httpOnly = true;
        session.path = '/';
      }

      return { message: 'Logged in successfully' };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )
  .get('/me', async ({ set, cookie: { session } }) => {
    const sessionToken = session?.value;

    if (!sessionToken || typeof sessionToken !== 'string') {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const [sessionData] = await db
      .select({
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(eq(sessions.id, sessionToken), gt(sessions.expiresAt, new Date()))
      );

    if (!sessionData) {
      set.status = 401;
      return { error: 'Invalid or expired session' };
    }

    return sessionData.user;
  });
