import { connect, MqttClient } from 'mqtt'

const WS_URL = process.env.EXPO_PUBLIC_MQTT_WS_URL || 'ws://localhost:9001'

export function createMqtt(token?: string): MqttClient {
  return connect(WS_URL, { protocol: 'ws', reconnectPeriod: 2000, username: token ? 'bearer' : undefined, password: token })
}


