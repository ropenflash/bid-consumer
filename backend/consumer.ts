// backend/consumer.ts

import { Kafka } from 'kafkajs';
import { startWebSocketServer, broadcastBid } from './websocket';

const kafka = new Kafka({
  clientId: process.env.CLIENT_ID,
  brokers: [process.env.BOOTSTRAP_SERVERS || ""],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.USERNAME || "",
    password: process.env.PASSWORD || "",
  },
});

const consumer = kafka.consumer({ groupId: process.env.GROUP_ID || "" });

const runConsumer = async () => {
  // Start WebSocket server for broadcasting
  startWebSocketServer();

  await consumer.connect();
  await consumer.subscribe({ topic: 'bids', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return;

      try {
        const bid = JSON.parse(value);
        console.log(`📥 Received bid from Kafka:`, bid);

        // Broadcast to all WebSocket clients
        broadcastBid(bid);
      } catch (err) {
        console.error('❌ Failed to parse bid:', err);
      }
    },
  });
};

runConsumer().catch((err) => {
  console.error('❌ Kafka consumer error:', err);
});
