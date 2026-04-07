import { Elysia } from 'elysia';
import { auth } from './auth';

const app = new Elysia()
  .use(auth)
  .get('/', () => 'Hello Elysia!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
