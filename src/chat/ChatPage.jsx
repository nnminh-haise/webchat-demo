import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatPage.css";
import io from "socket.io-client";
import axios from "axios";

/**
 * TODO: implement disconnect socket server when user leave chat page
 * TODO: resolve current conversation lost when page reload
 * TODO: implement sending message to the server
 */

const BACKEND_SERVER_URL = "http://localhost:8081";
const FETCH_USER_PROFILE = `${BACKEND_SERVER_URL}/api/v1/users/me`;
const FETCH_CONVERSATIONS_URL = `${BACKEND_SERVER_URL}/api/v1/user-to-groups/groups`;

let socket = null;

const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

const connectToSocket = (accessToken) => {
  if (socket) {
    return;
  }

  socket = io(BACKEND_SERVER_URL, {
    auth: {
      Bearer: getAccessToken(),
    },
  });
};

const joinRoom = (roomId, userId) => {
  if (!socket) {
    console.error("Socket is not connected");
    return;
  }

  socket.emit("join-room", { roomId, userId });
};

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const accessToken = getAccessToken();
        if (!accessToken) {
          navigate("/");
          return;
        }

        const response = await axios.get(FETCH_USER_PROFILE, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setCurrentUser(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/");
        }
      }
    };

    fetchUserProfile();

    const handleStorageChange = () => {
      fetchUserProfile();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (currentUser) {
        try {
          const accessToken = getAccessToken();
          const url = `${FETCH_CONVERSATIONS_URL}/${currentUser._id}`;
          const response = await axios.get(url, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const conversationsArray = Object.values(response.data);
          setConversations(conversationsArray);
        } catch (error) {
          console.error("Error fetching conversations:", error);
        }
      }
    };

    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("receive-message", (message) => {
      console.log("Received message:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // return () => {
    //   if (socket) {
    //     socket.off("receive-message");
    //   }
    // };
  }, [socket]);

  const handleConversationClick = (conversation) => {
    console.log("Clicked conversation:", conversation);
    setCurrentConversation(conversation);

    connectToSocket(getAccessToken());
    joinRoom(conversation.groupChatId._id, currentUser._id);
  };

  return (
    <div className="chat-page-container">
      <div className="user-section">
        {currentUser ? (
          <div className="profile-section">
            <h2>
              {currentUser.first_name} {currentUser.last_name}
            </h2>
            <p>@{currentUser.username}</p>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
        <div className="conversation-list-section">
          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              className="conversation-item"
              onClick={() => handleConversationClick(conversation)}
            >
              {conversation.groupChatId.name}
            </div>
          ))}
        </div>
      </div>
      <div className="chat-section">
        <div className="messages-section">
          <div className="messages-section">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.userId._id !== currentUser._id
                    ? "receipent"
                    : "sender"
                }`}
              >
                {message.userId._id !== currentUser._id ? (
                  <p className="sender-name">{message.userId.lastName}</p>
                ) : null}
                <p
                  className={`message-text ${
                    message.userId._id !== currentUser._id
                      ? "receipent"
                      : "sender"
                  }`}
                >
                  {message.message}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="message-input-section">
          <input type="text" placeholder="Type your message here..." />
          <button>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
