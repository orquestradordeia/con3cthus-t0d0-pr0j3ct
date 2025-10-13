import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
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

export type Task = { id: string; title: string; status: 'PENDING'|'DONE' }

export async function listTasks(): Promise<Task[]> {
  const res = await api.get('/tasks')
  return res.data
}

export async function createTask(data: { title: string }): Promise<Task> {
  const res = await api.post('/tasks', data)
  return res.data
}

export async function toggleTask(t: Task): Promise<Task> {
  const res = await api.patch(`/tasks/${t.id}`, { status: t.status === 'DONE' ? 'PENDING' : 'DONE' })
  return res.data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}


