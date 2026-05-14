import request from 'supertest'
import app from '../app'

describe('POST /auth/register', () => {
  it('이메일과 비밀번호로 회원가입이 된다', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '1234' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('email', 'test@test.com')
  })

  it('이미 가입된 이메일로 회원가입하면 409가 온다', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '1234' })

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '1234' })

    expect(res.status).toBe(409)
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: '1234' })
  })

  it('올바른 이메일/비밀번호로 로그인하면 토큰이 온다', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: '1234' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('틀린 비밀번호로 로그인하면 401이 온다', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@test.com', password: 'wrong' })

    expect(res.status).toBe(401)
  })
})
