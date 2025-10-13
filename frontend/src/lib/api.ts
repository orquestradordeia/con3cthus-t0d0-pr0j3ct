import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function login(email: string, password: string): Promise<string> {
  const res = await api.post('/auth/login', { email, password })
  return res.data.token
}

export async function register(email: string, password: string, name: string): Promise<string> {
  const res = await api.post('/auth/register', { email, password, name })
  return res.data.token
}

export type Task = { id: string; title: string; description?: string; status: 'PENDING' | 'DONE'; dueDate?: string; createdAt: string }

export async function listTasks(status?: 'PENDING' | 'DONE'): Promise<Task[]> {
  const res = await api.get('/tasks', { params: { status } })
  return res.data
}

export async function createTask(data: { title: string; description?: string; dueDate?: string }): Promise<Task> {
  const res = await api.post('/tasks', data)
  return res.data
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const res = await api.patch(`/tasks/${id}`, data)
  return res.data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}


