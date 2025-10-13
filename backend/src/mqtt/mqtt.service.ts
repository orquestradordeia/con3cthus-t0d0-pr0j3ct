import { Injectable, OnModuleDestroy } from '@nestjs/common';
import mqtt, { MqttClient } from 'mqtt';

@Injectable()
export class MqttService implements OnModuleDestroy {
  private client: MqttClient;

  constructor() {
    const url = process.env.MQTT_URL || 'mqtt://localhost:1883'
    this.client = mqtt.connect(url);
  }

  async onModuleDestroy() {
    try { this.client?.end(); } catch {}
  }

  publish(topic: string, payload: any) {
    this.client.publish(topic, JSON.stringify(payload));
  }
}


