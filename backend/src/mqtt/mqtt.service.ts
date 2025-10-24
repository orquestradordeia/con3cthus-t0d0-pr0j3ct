import { Injectable, OnModuleDestroy } from '@nestjs/common';
import mqtt, { MqttClient } from 'mqtt';

@Injectable()
export class MqttService implements OnModuleDestroy {
  private client: MqttClient | null = null;
  private connected = false;

  constructor() {
    try {
      const url = process.env.MQTT_URL || 'mqtt://localhost:1883';
      this.client = mqtt.connect(url);
      this.client.on('connect', () => { this.connected = true; });
      this.client.on('error', () => { this.connected = false; });
      this.client.on('close', () => { this.connected = false; });
    } catch {
      this.client = null;
      this.connected = false;
    }
  }

  async onModuleDestroy() {
    try { this.client?.end(); } catch {}
  }

  publish(topic: string, payload: any) {
    try {
      if (this.client && this.connected) {
        this.client.publish(topic, JSON.stringify(payload));
      }
    } catch { /* noop quando MQTT não disponível */ }
  }
}


