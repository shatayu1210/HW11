// shipping-service.js
const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');
const Shipping = require('./shippingModel');

const MONGODB_URI = 'REMOVED_SECRET';

// Kafka config
const kafka = new Kafka({
  clientId: 'shipping-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'shipping-group' });

async function run() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log("Connected to MongoDB");

  await consumer.connect();
  await consumer.subscribe({ topic: 'order-confirmed', fromBeginning: false });
  console.log("Listening to topic: order-confirmed");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const order = JSON.parse(message.value.toString());
      console.log("Received order:", order);

      const trackingId = 'SHIP-' + Math.random().toString(36).substring(2, 7).toUpperCase();

      const shippingRecord = new Shipping({
        itemId: order.itemId,
        itemName: order.itemName,
        quantity: order.quantity,
        trackingId
        // Status will be set by default to 'Pending'
      });

      await shippingRecord.save();
      console.log("Shipping record saved to db:", shippingRecord);
    }
  });
}

run().catch(console.error);