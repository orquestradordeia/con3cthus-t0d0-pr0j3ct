import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

jest.mock('../lib/api', () => ({
  __esModule: true,
  listTasks: jest.fn().mockResolvedValue([]),
  createTask: jest.fn(),
  deleteTask: jest.fn(),
  updateTask: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  me: jest.fn().mockResolvedValue({ id: 'u1', email: 'a@a.com', name: 'A', createdAt: new Date().toISOString() })
}))

jest.mock('../lib/mqttClient', () => ({
  __esModule: true,
  createMqtt: () => ({ subscribe: () => {}, on: () => {}, end: () => {} })
}))

import { App } from './App'

describe('App', () => {
  it('renderiza bem-vindo na rota /', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(/Bem-vindo/i)).toBeInTheDocument()
  })
})


