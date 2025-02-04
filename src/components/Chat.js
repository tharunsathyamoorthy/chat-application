import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';

const Chat = () => {
  const [user1Message, setUser1Message] = useState('');
  const [user2Message, setUser2Message] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [file, setFile] = useState(null);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    // Fetch chat history from the backend
    axios.get('http://localhost:5000/chats')
      .then((response) => setChatHistory(response.data))
      .catch((error) => console.error('Error fetching chat history:', error));
  }, []);

  const sendMessage = (e, user) => {
    e.preventDefault();
    const message = user === 'User1' ? user1Message : user2Message;
    if (message.trim()) {
      const newMessage = { message, user };
      axios.post('http://localhost:5000/chats', newMessage)
        .then((response) => {
          setChatHistory([...chatHistory, response.data]);
          user === 'User1' ? setUser1Message('') : setUser2Message('');
          chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight; // Auto-scroll
        })
        .catch((error) => console.error('Error sending message:', error));
    }
  };

  const sendFile = (e, user) => {
    e.preventDefault();
    if (!file) return alert('Please select a file to share.');
    if (file.size > 60 * 1024 * 1024) return alert('File size exceeds the 60 MB limit.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);

    axios.post('http://localhost:5000/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
      .then((response) => {
        setChatHistory([...chatHistory, response.data]);
        setFile(null); // Clear the file input
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight; // Auto-scroll
      })
      .catch((error) => console.error('Error uploading file:', error));
  };

  return (
    <Container className="chat-container">
      <Row className="justify-content-md-center mt-5">
        <Col xs={12} md={8}>
          <div ref={chatWindowRef} className="chat-window border p-4 mb-4" style={{ height: '500px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
            {chatHistory.map((msg, index) => (
              <div key={index} className={`d-flex my-2 ${msg.user === 'User1' ? 'justify-content-start' : 'justify-content-end'}`}>
                <div className={`message p-2 ${msg.user === 'User1' ? 'bg-primary' : 'bg-success'} text-white`} style={{ borderRadius: '20px', maxWidth: '60%' }}>
                  <strong>{msg.user}:</strong> {msg.message}
                  {msg.file && (
                    <div>
                      <a href={`http://localhost:5000/uploads/${msg.file}`} target="_blank" rel="noopener noreferrer" className="text-white">
                        📎 {msg.file}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="message-inputs">
            <Form onSubmit={(e) => sendMessage(e, 'User1')} className="mb-2">
              <Form.Group className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="User1: Type a message..."
                  value={user1Message}
                  onChange={(e) => setUser1Message(e.target.value)}
                  className="mr-2"
                />
                <Button variant="primary" type="submit">
                  Send
                </Button>
              </Form.Group>
            </Form>

            <Form onSubmit={(e) => sendMessage(e, 'User2')}>
              <Form.Group className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="User2: Type a message..."
                  value={user2Message}
                  onChange={(e) => setUser2Message(e.target.value)}
                  className="mr-2"
                />
                <Button variant="success" type="submit">
                  Send
                </Button>
              </Form.Group>
            </Form>

            {/* File Upload Section */}
            <Form onSubmit={(e) => sendFile(e, 'User1')} className="mt-3">
              <Form.Group className="d-flex align-items-center">
                <Form.Control
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="mr-2"
                />
                <Button variant="info" type="submit">
                  Share File
                </Button>
              </Form.Group>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Chat;
