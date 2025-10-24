import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { createTask, deleteTask, listTasks, login, me, register, Task, updateTask } from '../lib/api'
import { createMqtt } from '../lib/mqttClient'

function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const login = (t: string) => { localStorage.setItem('token', t); setToken(t) }
  const logout = () => { localStorage.removeItem('token'); setToken(null) }
  return { token, login, logout }
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white">
      <div className="sticky top-0 z-10 mx-auto max-w-6xl p-4">
        <div className="glass-nav px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold tracking-tight">Conecthus</Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link to="/tasks" className="hover:underline">Tarefas</Link>
            <Link to="/login" className="hover:underline">Entrar</Link>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-6xl p-4">
        {children}
      </main>
    </div>
  )
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
    <div className="grid place-items-center py-16">
      <form onSubmit={submit} className="glass-card w-full max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Acessar conta</h1>
        <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input" placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="flex items-center justify-between">
          <Link to="/register" className="text-sm text-white/80 hover:underline">Criar conta</Link>
          <button className="btn-primary" type="submit">Entrar</button>
        </div>
      </form>
    </div>
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
    <div className="grid place-items-center py-16">
      <form onSubmit={submit} className="glass-card w-full max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <input className="input" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input" placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="flex items-center justify-end">
          <button className="btn-primary" type="submit">Cadastrar</button>
        </div>
      </form>
    </div>
  )
}

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  useEffect(() => {
    (async () => {
      const data = await listTasks(undefined, from || undefined, to || undefined)
      setTasks(data)
    })()
  }, [from, to])
  const create = async () => {
    if (!title.trim()) return
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
    let mounted = true
    const token = localStorage.getItem('token') || undefined
    const client = createMqtt(token)
    ;(async () => {
      const profile = await me()
      if (!mounted) return
      const userTopic = `users/${profile.id}/tasks/created`
      client.subscribe(userTopic)
    })()
    client.on('message', (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString())
        if (data?.id && data?.title) setTasks(prev => [data as Task, ...prev])
      } catch {}
    })
    return () => { mounted = false; client.end() }
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="glass-card p-6">
        <h1 className="text-2xl font-semibold mb-4">Tarefas</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input className="input" placeholder="Nova tarefa" value={title} onChange={e => setTitle(e.target.value)} />
          <button onClick={create} className="btn-primary">Criar</button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>
      <ul className="glass-card divide-y divide-white/10">
        {tasks.map(t => (
          <li key={t.id} className="flex items-center gap-3 p-4">
            <input className="h-5 w-5 rounded border-white/30 bg-white/10" type="checkbox" checked={t.status === 'DONE'} onChange={() => toggle(t)} />
            <span className={t.status === 'DONE' ? 'line-through text-white/70' : ''}>{t.title}</span>
            <button onClick={() => remove(t.id)} className="ml-auto text-sm text-red-300 hover:text-red-200">Excluir</button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="p-6 text-white/70">Sem tarefas ainda. Crie a primeira acima.</li>
        )}
      </ul>
    </div>
  )
}

export function App() {
  const { token, login, logout } = useAuth()

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-10 mx-auto max-w-6xl p-4">
        <div className="glass-nav px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold tracking-tight">Conecthus</Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            {!!token ? (
              <>
                <Link to="/tasks" className="hover:underline">Tarefas</Link>
                <button onClick={logout} className="text-white/80 hover:underline">Sair</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Registrar</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Routes>
          <Route path="/" element={
            <section className="grid lg:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight">Organize suas tarefas com elegância</h1>
                <p className="text-white/80">Crie, filtre e receba novas tarefas em tempo real via MQTT.</p>
                <div className="flex gap-3">
                  <Link to={token ? '/tasks' : '/login'} className="btn-primary">Começar</Link>
                  <a href="/api" className="inline-flex items-center justify-center rounded-lg px-4 py-2 border border-white/20 text-white/90">Swagger</a>
                </div>
              </div>
              <div className="glass-card p-6">
                <p className="text-white/80">Dica: faça login para receber tarefas criadas via MQTT no topo da lista.</p>
              </div>
            </section>
          } />
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tasks" element={token ? <TasksPage /> : <LoginPage onLogin={login} />} />
        </Routes>
      </main>
    </div>
  )
}


