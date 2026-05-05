import {
  loginSchema,
  createCredentialSchema,
  createTaskSchema,
  createUserSchema,
  sanitizeText,
} from '@/lib/validation'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'pass' })).not.toThrow()
  })
  it('rejects invalid email', () => {
    expect(() => loginSchema.parse({ email: 'not-email', password: 'pass' })).toThrow()
  })
  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).toThrow()
  })
})

describe('createCredentialSchema', () => {
  it('accepts valid credential', () => {
    const data = { name: 'Stripe Key', value: 'sk_live_xyz', category: 'SERVICE', sharedWith: [] }
    expect(() => createCredentialSchema.parse(data)).not.toThrow()
  })
  it('rejects empty name', () => {
    expect(() => createCredentialSchema.parse({ name: '', value: 'val', category: 'SERVICE', sharedWith: [] })).toThrow()
  })
  it('rejects name over 100 chars', () => {
    expect(() => createCredentialSchema.parse({ name: 'x'.repeat(101), value: 'val', category: 'SERVICE', sharedWith: [] })).toThrow()
  })
  it('rejects invalid category', () => {
    expect(() => createCredentialSchema.parse({ name: 'Test', value: 'val', category: 'INVALID', sharedWith: [] })).toThrow()
  })
})

describe('createTaskSchema', () => {
  it('accepts valid task', () => {
    expect(() => createTaskSchema.parse({ title: 'Fix bug', priority: 'HIGH', status: 'TODO' })).not.toThrow()
  })
  it('rejects empty title', () => {
    expect(() => createTaskSchema.parse({ title: '', priority: 'HIGH', status: 'TODO' })).toThrow()
  })
  it('rejects invalid status', () => {
    expect(() => createTaskSchema.parse({ title: 'Task', priority: 'HIGH', status: 'INVALID' })).toThrow()
  })
})

describe('createUserSchema', () => {
  it('accepts valid user', () => {
    expect(() => createUserSchema.parse({ email: 'dev@test.com', name: 'Dev', role: 'DEV', password: 'securepass123' })).not.toThrow()
  })
  it('rejects password under 8 chars', () => {
    expect(() => createUserSchema.parse({ email: 'dev@test.com', name: 'Dev', role: 'DEV', password: 'short' })).toThrow()
  })
})

describe('sanitizeText', () => {
  it('strips HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>hello')).toBe('hello')
  })
  it('keeps plain text', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world')
  })
})
