import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('Tasks e2e', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => { await app.close() })

  it('fluxo básico: register → login → CRUD', async () => {
    const email = `u${Date.now()}@a.com`
    await request(app.getHttpServer()).post('/auth/register').send({ email, password: '123456', name: 'A' }).expect(201)
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: '123456' }).expect(201)
    const token = login.body.token
    const auth = { Authorization: `Bearer ${token}` }
    const created = await request(app.getHttpServer()).post('/tasks').set(auth).send({ title: 'Teste' }).expect(201)
    const id = created.body.id
    await request(app.getHttpServer()).get('/tasks').set(auth).expect(200)
    await request(app.getHttpServer()).patch(`/tasks/${id}`).set(auth).send({ status: 'DONE' }).expect(200)
    await request(app.getHttpServer()).delete(`/tasks/${id}`).set(auth).expect(200)
  })
})


