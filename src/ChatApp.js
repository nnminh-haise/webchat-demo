import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './ChatApp.css';

const socket = io('localhost:8080');

function ChatApp() {
    const [userId, setUserId] = useState('');
    const [message, setMessage] = useState('');
    const [incomingMessages, setIncomingMessages] = useState([]);

    useEffect(() => {
        // Listen for 'chat' event from backend
        socket.on('message', (message) => {
            setIncomingMessages([...incomingMessages, message]);
        });

        // Clean up listener when component unmounts
        return () => {
            socket.off('chat');
        };
    }, [incomingMessages]);

    const sendMessage = () => {
        if (userId && message) {
            // console.log("send");
            // console.log("sending message: ", message);
            socket.emit('chat', { userId, message });
            setMessage('');
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {incomingMessages.map((msg, index) => (
                    <div className="message" key={index}>
                        <strong>{msg.userId}:</strong> {msg.message}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Your Name"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                />
                <textarea
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default ChatApp;
