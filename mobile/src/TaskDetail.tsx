import React, { useState } from 'react'
import { View, Text, TextInput, Button } from 'react-native'
import { Task } from './api'

type Props = { task: Task; onSave: (title: string) => void; onClose: () => void }

export function TaskDetail({ task, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Detalhes da tarefa</Text>
      <TextInput value={title} onChangeText={setTitle} style={{ borderWidth: 1, padding: 8, marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Salvar" onPress={() => onSave(title)} />
        <Button title="Fechar" onPress={onClose} />
      </View>
    </View>
  )
}


