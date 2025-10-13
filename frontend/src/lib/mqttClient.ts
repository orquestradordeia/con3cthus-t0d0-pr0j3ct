import { connect, MqttClient } from 'mqtt'

const WS_URL = (import.meta.env.VITE_MQTT_WS_URL as string) || 'ws://localhost:9001'

export function createMqtt(token?: string): MqttClient {
  const url = WS_URL
  const client = connect(url, { protocol: 'ws', reconnectPeriod: 2000, username: token ? 'bearer' : undefined, password: token })
  return client
}


