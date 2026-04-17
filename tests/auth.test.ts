import { describe, expect, it } from 'bun:test';
import { app } from '../src/app';

describe('Authentication Flow', () => {
    const email = `test-${crypto.randomUUID()}@example.com`;
    const password = 'password123';

    it('should register a new user successfully', async () => {
        const response = await app.handle(
            new Request('http://localhost/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email,
                    password,
                }),
            })
        );
        
        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.message).toBe('User registered successfully');
    });

    it('should login and return a session cookie', async () => {
        const response = await app.handle(
            new Request('http://localhost/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
        );
        
        expect(response.status).toBe(200);
        const cookie = response.headers.get('set-cookie');
        expect(cookie).toContain('session=');
        
        const body = await response.json() as any;
        expect(body.message).toBe('Logged in successfully');
    });

    it('should not allow login with wrong password', async () => {
        const response = await app.handle(
            new Request('http://localhost/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: 'wrongpassword' }),
            })
        );
        
        expect(response.status).toBe(401);
        const body = await response.json() as any;
        expect(body.error).toBe('Invalid email or password');
    });
});
