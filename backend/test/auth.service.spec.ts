import { JwtService } from '@nestjs/jwt'
import { AuthService } from '../src/auth/auth.service'

describe('AuthService', () => {
  it('register deve criar token', async () => {
    const prisma: any = { user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'u1' }) } }
    const jwt = { signAsync: jest.fn().mockResolvedValue('token') } as unknown as JwtService
    const svc = new AuthService(prisma, jwt)
    const res = await svc.register('a@a.com', '123', 'A')
    expect(res.token).toBe('token')
  })
})


