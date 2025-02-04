const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
const mongoUri = 'mongodb://localhost:27017/chatApp';  // Replace with your MongoDB connection string
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define the schema for chat messages
const MessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  type: { type: String, default: 'text' }, // text or audio
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

// When a user connects
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Fetch all chat messages when a user connects
  Message.find().then((messages) => {
    socket.emit('load_messages', messages);
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    const newMessage = new Message(data);
    newMessage.save().then(() => {
      io.emit('receive_message', newMessage);
    });
  });

  // Handle deleting messages
  socket.on('delete_message', (messageId) => {
    Message.findByIdAndDelete(messageId).then(() => {
      io.emit('remove_message', messageId);
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});
