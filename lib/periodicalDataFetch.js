require('dotenv').config();
const express = require('express');
const http = require('http');
const { MongoClient } = require('mongodb');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

function PeriodicallyfETCH(params) {
    
}


// MongoDB connection
const url = process.env.MONGO_URI; // Example: 'mongodb://localhost:27017'
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = process.env.MONGO_DBNAME; // Example: 'mydatabase'

async function fetchDocuments() {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('your_collection_name'); // Replace with your collection name

  const documents = await collection.find({}).toArray(); // Fetch all documents
  return documents;
}

// Serve static files
app.use(express.static('public'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Periodically fetch data and emit to clients
  setInterval(async () => {
    const documents = await fetchDocuments();
    socket.emit('updateData', documents);
  }, 5000); // Adjust the interval as needed
});
