// ChatPage.js
import React, { useState, useEffect } from 'react';
import './ChatApp.css';
import io from 'socket.io-client';

const socket = io('http://localhost:8080'); // Replace with your server URL

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    socket.on('receive-message', (data) => {
      const incomingMessage = data.message;
      const sender = data.sender;
      // const roomId = data.roomId;
      setMessages((prevMessages) => [...prevMessages, { text: incomingMessage, sender: sender }]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, []);

  const handleMessageSend = () => {
    if (messageInput.trim() === '') return;

    socket.emit('send-message', {
        roomId: roomId,
        sender: username,
        message: messageInput,
      }
    );

    setMessages((prevMessages) => [...prevMessages, { text: messageInput, sender: 'self' }]);
    setMessageInput('');
  };

  const handleRoomJoin = () => {
    if (roomId === '') return;

    socket.emit('join-room', {
      roomId: roomId,
      username: username,
    });
  };

  return (
    <div className="chat-container">
      <div className="header">
        <input
          type="text"
          placeholder="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={handleRoomJoin}>Join Room</button>
      </div>
      <div className="message-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === 'self' ? 'own-message' : 'other-message'}`}>
            {msg.sender !== 'self' && <span className="sender">{msg.sender}: </span>}{msg.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
        />
        <button onClick={handleMessageSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatPage;
