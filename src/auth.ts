import { Elysia, t } from 'elysia';
import { db } from './db';
import { users, sessions } from './db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { rateLimit } from 'elysia-rate-limit';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date | null;
}

export const baseAuth = new Elysia({ name: 'baseAuth' })
  .derive(async ({ cookie: { session } }): Promise<{ user: User | null }> => {
    const sessionToken = session?.value;

    if (!sessionToken || typeof sessionToken !== 'string') {
      return { user: null };
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
        and(eq(sessions.id, sessionToken as string), gt(sessions.expiresAt, new Date()))
      );

    return { user: sessionData?.user ?? null };
  });

export const auth = new Elysia({ prefix: '/api' })
  .use(baseAuth)
  .use(process.env.NODE_ENV === 'test' ? (app) => app : rateLimit({
    max: 10,
    duration: 60000,
    errorResponse: 'Too many requests'
  }))
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
        session.secure = process.env.NODE_ENV === 'production';
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
  .post('/logout', async ({ user, cookie: { session }, set }: any) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const sessionToken = session?.value;
    if (sessionToken && typeof sessionToken === 'string') {
      await db.delete(sessions).where(eq(sessions.id, sessionToken));
      session.remove();
    }

    return { message: 'Logged out successfully' };
  })
  .get('/me', async ({ user, set }: any) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    return user;
  });
