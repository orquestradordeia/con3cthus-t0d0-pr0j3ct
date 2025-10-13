import React, { useEffect, useState } from 'react'
import { SafeAreaView, Text, TextInput, Button, View, FlatList, TouchableOpacity, Modal } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createTask, deleteTask, listTasks, login as apiLogin, Task, toggleTask, me } from './src/api'
import { createMqtt } from './src/mqtt'

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => { AsyncStorage.getItem('token').then(setToken) }, [])

  const login = async () => {
    const t = await apiLogin(email, password)
    await AsyncStorage.setItem('token', t)
    setToken(t)
  }

  const logout = async () => {
    await AsyncStorage.removeItem('token')
    setToken(null)
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      {!token ? (
        <View>
          <Text>Login</Text>
          <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
          <TextInput placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
          <Button title="Entrar" onPress={login} />
        </View>
      ) : (
        <TasksScreen onLogout={logout} />
      )}
    </SafeAreaView>
  )
}

function TasksScreen({ onLogout }: { onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState<{ visible: boolean; task?: Task }>({ visible: false })

  useEffect(() => { (async () => setTasks(await listTasks()))() }, [])

  useEffect(() => {
    (async () => {
      const tok = await AsyncStorage.getItem('token')
      const profile = await me()
      const c = createMqtt(tok || undefined)
      c.subscribe(`users/${profile.id}/tasks/created`)
      c.on('message', (_, payload) => {
        try { const data = JSON.parse(payload.toString()); if (data?.id) setTasks(prev => [data as Task, ...prev]) } catch {}
      })
    })()
    return () => {}
  }, [])

  const create = async () => {
    if (!title) return
    const t = await createTask({ title })
    setTasks(prev => [t, ...prev])
    setTitle('')
  }

  const toggle = async (t: Task) => {
    const u = await toggleTask(t)
    setTasks(prev => prev.map(p => p.id === u.id ? u : p))
  }

  const remove = async (id: string) => {
    await deleteTask(id)
    setTasks(prev => prev.filter(p => p.id !== id))
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
        <TextInput style={{ flex: 1, borderWidth: 1, padding: 8 }} placeholder="Nova tarefa" value={title} onChangeText={setTitle} />
        <Button title="Criar" onPress={create} />
        <Button title="Sair" onPress={onLogout} />
      </View>
      <FlatList
        data={tasks}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 }}>
            <TouchableOpacity onPress={() => toggle(item)}>
              <Text>{item.status === 'DONE' ? '☑️' : '⬜️'}</Text>
            </TouchableOpacity>
            <Text style={{ marginLeft: 8 }} onPress={() => setOpen({ visible: true, task: item })}>{item.title}</Text>
            <View style={{ marginLeft: 'auto' }}>
              <Button title="Excluir" onPress={() => remove(item.id)} />
            </View>
          </View>
        )}
      />
      <Modal visible={open.visible} animationType="slide" onRequestClose={() => setOpen({ visible: false })}>
        {open.task && (
          <TaskDetail
            task={open.task}
            onSave={(newTitle) => {
              setTasks(prev => prev.map(p => p.id === open.task!.id ? { ...p, title: newTitle } as Task : p))
              setOpen({ visible: false })
            }}
            onClose={() => setOpen({ visible: false })}
          />
        )}
      </Modal>
    </View>
  )
}


