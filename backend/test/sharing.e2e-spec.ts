import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

// Use an isolated in-memory database and deterministic secrets for the run.
process.env.DATABASE_PATH = ':memory:';
process.env.JWT_SECRET = 'e2e-test-secret';
process.env.SEED_PASSWORD = 'password123';
process.env.NODE_ENV = 'test';

import { AppModule } from '../src/app.module';

async function login(server: App, email: string): Promise<string> {
  const res = await request(server)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
    .expect(200);
  return res.body.accessToken as string;
}

describe('Sharing flow (e2e)', () => {
  let app: INestApplication;
  let server: App;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets an owner share a document and controls a collaborator’s access', async () => {
    const aliceToken = await login(server, 'alice@ajaia.dev');
    const bobToken = await login(server, 'bob@ajaia.dev');

    // Alice creates a fresh document.
    const created = await request(server)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Quarterly plan', contentHtml: '<p>Draft</p>' })
      .expect(201);
    const docId = created.body.id as string;
    expect(created.body.access).toBe('owner');

    // Bob cannot see it yet.
    await request(server)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(403);

    // Alice shares it with Bob as a viewer.
    await request(server)
      .post(`/api/documents/${docId}/shares`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob@ajaia.dev', role: 'viewer' })
      .expect(201);

    // Bob can now read it, and it reports viewer access.
    const bobView = await request(server)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);
    expect(bobView.body.access).toBe('viewer');

    // But a viewer cannot edit.
    await request(server)
      .patch(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ contentHtml: '<p>Bob was here</p>' })
      .expect(403);

    // Alice upgrades Bob to editor.
    await request(server)
      .post(`/api/documents/${docId}/shares`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob@ajaia.dev', role: 'editor' })
      .expect(201);

    // Now Bob can edit.
    const edited = await request(server)
      .patch(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ contentHtml: '<p>Bob edited this</p>' })
      .expect(200);
    expect(edited.body.contentHtml).toContain('Bob edited this');

    // Only the owner can delete.
    await request(server)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(403);
    await request(server)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(204);
  });

  it('rejects invalid login credentials', async () => {
    await request(server)
      .post('/api/auth/login')
      .send({ email: 'alice@ajaia.dev', password: 'wrong' })
      .expect(401);
  });
});
