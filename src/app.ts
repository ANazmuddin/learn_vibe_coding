import { Elysia } from 'elysia';
import { auth } from './auth';
import { tasksPlugin } from './tasks';
import { cors } from '@elysiajs/cors';

export const app = new Elysia()
  .use(cors())
  .onError(({ code, error, set }: any) => {
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        error: 'Validation Error',
        details: error.all.map((err: any) => ({
          path: err.path,
          message: err.message
        }))
      };
    }
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Not Found' };
    }
    if (code === 'INTERNAL_SERVER_ERROR') {
      set.status = 500;
      return { 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
      };
    }
  })
  .use(auth)
  .use(tasksPlugin)
  .get('/', () => 'Hello Elysia!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));
