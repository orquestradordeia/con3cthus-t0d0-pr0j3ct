import mqtt, { MqttClient } from 'mqtt'

// Permite configurar a URL via window.ENV ou variável de ambiente
const WS_URL = (window as any).ENV?.MQTT_WS_URL || (import.meta.env.VITE_MQTT_WS_URL as string) || 'ws://localhost:9001'

export function createMqtt(token?: string): MqttClient {
  const url = WS_URL
  const client = mqtt.connect(url, { protocol: 'ws', reconnectPeriod: 2000, username: token ? 'bearer' : undefined, password: token })
  return client
}


