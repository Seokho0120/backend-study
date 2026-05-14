import request from 'supertest'
import app from '../app'

// 테스트에서 반복적으로 쓰는 "로그인해서 토큰 받기" 헬퍼 함수
async function registerAndLogin(email: string, password: string): Promise<string> {
  await request(app).post('/auth/register').send({ email, password })
  const res = await request(app).post('/auth/login').send({ email, password })
  return res.body.token
}

describe('GET /posts', () => {
  it('게시글 목록을 조회할 수 있다', async () => {
    const res = await request(app).get('/posts')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('posts')
    expect(res.body).toHaveProperty('pagination')
    expect(Array.isArray(res.body.posts)).toBe(true)
  })
})

describe('POST /posts', () => {
  it('로그인한 유저는 게시글을 작성할 수 있다', async () => {
    const token = await registerAndLogin('user@test.com', '1234')

    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '테스트 제목', content: '테스트 내용' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.title).toBe('테스트 제목')
  })

  it('토큰 없이 게시글을 작성하면 401이 온다', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ title: '테스트 제목', content: '테스트 내용' })

    expect(res.status).toBe(401)
  })
})

describe('PATCH /posts/:id', () => {
  it('작성자는 자신의 게시글을 수정할 수 있다', async () => {
    const token = await registerAndLogin('user@test.com', '1234')

    const createRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '원래 제목', content: '원래 내용' })

    const postId = createRes.body.id

    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '수정된 제목' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('수정된 제목')
  })

  it('다른 유저의 게시글을 수정하면 403이 온다', async () => {
    const authorToken = await registerAndLogin('author@test.com', '1234')
    const otherToken = await registerAndLogin('other@test.com', '1234')

    const createRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ title: '원래 제목', content: '원래 내용' })

    const postId = createRes.body.id

    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: '수정 시도' })

    expect(res.status).toBe(403)
  })
})

describe('DELETE /posts/:id', () => {
  it('작성자는 자신의 게시글을 삭제할 수 있다', async () => {
    const token = await registerAndLogin('user@test.com', '1234')

    const createRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '삭제할 글', content: '내용' })

    const postId = createRes.body.id

    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })
})
