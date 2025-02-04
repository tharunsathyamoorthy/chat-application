import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // Import custom CSS

const socket = io.connect('http://localhost:5000');

const App = () => {
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    socket.on('load_messages', (messages) => {
      setChat(messages);
    });

    socket.on('receive_message', (data) => {
      setChat((prevChat) => [...prevChat, data]);
    });

    socket.on('remove_message', (messageId) => {
      setChat((prevChat) => prevChat.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socket.off('load_messages');
      socket.off('receive_message');
      socket.off('remove_message');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() && username) {
      const data = { id: Date.now(), username, message, type: 'text' };
      socket.emit('send_message', data);
      setMessage('');
    }
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const data = { id: Date.now(), username, message: audioUrl, type: 'audio' };
        socket.emit('send_message', data);
        audioChunks.current = [];
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    });
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const deleteMessage = (id) => {
    socket.emit('delete_message', id);
  };

  const handleUsernameKeyPress = (e) => {
    if (e.key === 'Enter' && tempUsername.trim() && tempPassword.trim()) {
      e.preventDefault();
      setUsername(tempUsername);
      setPassword(tempPassword);
    }
  };

  return (
    <Container fluid className="app-container">
      <Row className="justify-content-md-center mt-5">
        <Col xs={12} md={8}>
          <h1 className="text-center text-white">Real-Time Chat</h1>

          {!username ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Enter your username:</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Username"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="text-white">Enter your password:</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  onKeyPress={handleUsernameKeyPress}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={() => {
                  if (tempUsername.trim() && tempPassword.trim()) {
                    setUsername(tempUsername);
                    setPassword(tempPassword);
                  }
                }}
              >
                Start Chatting
              </Button>
            </>
          ) : (
            <>
              <div className="chat-window border p-3 mb-4">
                {chat.map((msg) => (
                  <Card
                    key={msg._id || msg.id}
                    className={`mb-2 ${
                      msg.username === username ? 'message-sent' : 'message-received'
                    }`}
                  >
                    <Card.Body className="p-2">
                      <strong>{msg.username}: </strong>
                      {msg.type === 'text' ? (
                        <span>{msg.message}</span>
                      ) : (
                        <audio controls src={msg.message}></audio>
                      )}
                      {msg.username === username && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="ml-2 delete-btn"
                          onClick={() => deleteMessage(msg._id || msg.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>

              <Form.Group className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isRecording}
                  className="message-input"
                />
                <Button variant="primary" onClick={sendMessage} className="ml-2">
                  Send
                </Button>
                {!isRecording ? (
                  <Button variant="secondary" onClick={startRecording} className="ml-2">
                    Record Voice
                  </Button>
                ) : (
                  <Button variant="danger" onClick={stopRecording} className="ml-2">
                    Stop Recording
                  </Button>
                )}
              </Form.Group>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default App;
