import { describe, expect, it, beforeAll } from 'bun:test';
import { app } from '../src/app';

describe('Categories Management', () => {
  let sessionCookie: string;
  let createdCategoryId: number;
  const email = `category-test-${crypto.randomUUID()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    await app.handle(
      new Request('http://localhost/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Cat Tester', email, password }),
      })
    );

    const loginRes = await app.handle(
      new Request('http://localhost/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    );

    sessionCookie = loginRes.headers.get('set-cookie') || '';
  });

  it('should create a new category', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({ name: 'Work' }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.message).toBe('Category created successfully');
    createdCategoryId = body.id;
  });

  it('should list categories for the user', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/categories', {
        headers: { Cookie: sessionCookie },
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.some((c: any) => c.name === 'Work')).toBe(true);
  });

  it('should create a task with categoryId and dueDate', async () => {
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const response = await app.handle(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          title: 'Task with category',
          description: 'A categorized task',
          categoryId: createdCategoryId,
          dueDate,
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.message).toBe('Task created successfully');
  });

  it('should filter tasks by categoryId', async () => {
    const response = await app.handle(
      new Request(
        `http://localhost/api/tasks?categoryId=${createdCategoryId}`,
        {
          headers: { Cookie: sessionCookie },
        }
      )
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].categoryId).toBe(createdCategoryId);
  });

  it('should update category name', async () => {
    const response = await app.handle(
      new Request(`http://localhost/api/categories/${createdCategoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({ name: 'Personal' }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.message).toBe('Category updated successfully');
  });
});

describe('User Profile', () => {
  let sessionCookie: string;
  const email = `profile-test-${crypto.randomUUID()}@example.com`;
  const password = 'password123';
  const name = 'Profile Tester';

  beforeAll(async () => {
    await app.handle(
      new Request('http://localhost/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
    );

    const loginRes = await app.handle(
      new Request('http://localhost/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    );

    sessionCookie = loginRes.headers.get('set-cookie') || '';
  });

  it('should get user profile', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/users/profile', {
        headers: { Cookie: sessionCookie },
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.email).toBe(email);
    expect(body.name).toBe(name);
  });

  it('should update user profile name', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.message).toBe('Profile updated successfully');
  });

  it('should return 401 without session', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/users/profile')
    );
    expect(response.status).toBe(401);
  });
});
