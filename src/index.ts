import { Elysia } from 'elysia';
import { auth } from './auth';
import { tasksPlugin } from './tasks';

const app = new Elysia()
  .use(auth)
  .use(tasksPlugin)
  .get('/', () => 'Hello Elysia!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
