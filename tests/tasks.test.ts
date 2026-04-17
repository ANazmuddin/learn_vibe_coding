import { describe, expect, it, beforeAll } from 'bun:test';
import { app } from '../src/app';

describe('Tasks Management with Pagination and Filtering', () => {
    let sessionCookie: string;
    const email = `tasks-test-${crypto.randomUUID()}@example.com`;
    const password = 'password123';

    beforeAll(async () => {
        // Setup user for task tests
        await app.handle(new Request('http://localhost/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Task Runner', email, password })
        }));
        
        const loginRes = await app.handle(new Request('http://localhost/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }));
        
        sessionCookie = loginRes.headers.get('set-cookie') || '';
    });

    it('should create multiple tasks for pagination testing', async () => {
        for (let i = 1; i <= 5; i++) {
            const response = await app.handle(new Request('http://localhost/api/tasks', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cookie': sessionCookie 
                },
                body: JSON.stringify({ 
                    title: `Test Task ${i}`, 
                    description: `This is task number ${i}` 
                })
            }));
            expect(response.status).toBe(200);
        }
    });

    it('should retrieve tasks with limit and page meta', async () => {
        const response = await app.handle(new Request('http://localhost/api/tasks?page=1&limit=2', {
            headers: { 'Cookie': sessionCookie }
        }));
        
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        
        expect(body.data.length).toBe(2);
        expect(body.meta).toBeDefined();
        expect(body.meta.total).toBeGreaterThanOrEqual(5);
        expect(body.meta.limit).toBe(2);
        expect(body.meta.page).toBe(1);
    });

    it('should search for tasks by title', async () => {
        const response = await app.handle(new Request('http://localhost/api/tasks?search=Task 3', {
            headers: { 'Cookie': sessionCookie }
        }));
        
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        
        expect(body.data.length).toBe(1);
        expect(body.data[0].title).toBe('Test Task 3');
    });

    it('should filter tasks by completion status', async () => {
        // Initially none are completed
        const res1 = await app.handle(new Request('http://localhost/api/tasks?isCompleted=true', {
            headers: { 'Cookie': sessionCookie }
        }));
        const body1 = await res1.json() as any;
        expect(body1.data.length).toBe(0);

        // Update one task to completed
        const tasksRes = await app.handle(new Request('http://localhost/api/tasks', {
            headers: { 'Cookie': sessionCookie }
        }));
        const tasks = await tasksRes.json() as any;
        const taskId = tasks.data[0].id;

        await app.handle(new Request(`http://localhost/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': sessionCookie 
            },
            body: JSON.stringify({ isCompleted: true })
        }));

        // Check filter again
        const res2 = await app.handle(new Request('http://localhost/api/tasks?isCompleted=true', {
            headers: { 'Cookie': sessionCookie }
        }));
        const body2 = await res2.json() as any;
        expect(body2.data.length).toBe(1);
        expect(body2.data[0].id).toBe(taskId);
    });
});
