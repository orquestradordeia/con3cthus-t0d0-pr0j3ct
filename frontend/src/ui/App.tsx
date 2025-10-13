import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { createTask, deleteTask, listTasks, login, register, Task, updateTask } from '../lib/api'
import { createMqtt } from '../lib/mqttClient'

function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const login = (t: string) => { localStorage.setItem('token', t); setToken(t) }
  const logout = () => { localStorage.removeItem('token'); setToken(null) }
  return { token, login, logout }
}

function LoginPage({ onLogin }: { onLogin: (t: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = await login(email, password)
    onLogin(token)
    navigate('/')
  }
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 360, margin: '48px auto' }}>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
      <Link to="/register">Registrar</Link>
    </form>
  )
}

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = await register(email, password, name)
    localStorage.setItem('token', token)
    navigate('/login')
  }
  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 360, margin: '48px auto' }}>
      <h1>Registro</h1>
      <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Criar conta</button>
    </form>
  )
}

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  useEffect(() => { (async () => setTasks(await listTasks()))() }, [])
  const create = async () => {
    const t = await createTask({ title })
    setTasks(prev => [t, ...prev])
    setTitle('')
  }
  const toggle = async (t: Task) => {
    const updated = await updateTask(t.id, { status: t.status === 'DONE' ? 'PENDING' : 'DONE' } as any)
    setTasks(prev => prev.map(p => p.id === t.id ? updated : p))
  }
  const remove = async (id: string) => {
    await deleteTask(id)
    setTasks(prev => prev.filter(p => p.id !== id))
  }

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined
    const client = createMqtt(token)
    const userTopic = 'users/+/tasks/created' // em produção, preferir tópico do usuário
    client.subscribe(userTopic)
    client.on('message', (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString())
        if (data?.id && data?.title) setTasks(prev => [data as Task, ...prev])
      } catch {}
    })
    return () => client.end()
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', display: 'grid', gap: 12 }}>
      <h1>Tarefas</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Nova tarefa" value={title} onChange={e => setTitle(e.target.value)} />
        <button onClick={create}>Criar</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map(t => (
          <li key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
            <input type="checkbox" checked={t.status === 'DONE'} onChange={() => toggle(t)} />
            <span>{t.title}</span>
            <button onClick={() => remove(t.id)} style={{ marginLeft: 'auto' }}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function App() {
  const { token, login, logout } = useAuth()

  useEffect(() => { /* conectar MQTT depois */ }, [])

  return (
    <div>
      <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/">Home</Link>
        {!!token ? (
          <>
            <Link to="/tasks">Tarefas</Link>
            <button onClick={logout}>Sair</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<div style={{ padding: 24 }}>Bem-vindo</div>} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tasks" element={token ? <TasksPage /> : <LoginPage onLogin={login} />} />
      </Routes>
    </div>
  )
}


