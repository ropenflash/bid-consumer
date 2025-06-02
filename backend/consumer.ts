// backend/consumer.ts
import dotenv from 'dotenv';
dotenv.config();

import { Kafka } from 'kafkajs';
import { startWebSocketServer, broadcastBid } from './websocket';



console.log("the variable is", process.env.USERNAME)

const kafka = new Kafka({
  clientId: 'bidding-game-consumer',
  brokers: [process.env.BOOTSTRAP_SERVERS || ""],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.USERNAME || "",
    password: process.env.PASSWORD || "",
  },
});

const consumer = kafka.consumer({ groupId: 'bidding-game-group' });

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
