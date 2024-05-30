import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatPage.css";
import io from "socket.io-client";

const socket = io("http://localhost:8080");

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatDescription, setNewChatDescription] = useState("");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinChatName, setJoinChatName] = useState("");

  const messagesEndRef = useRef(null);

  const fetchChatName = async (chatId, jwtToken) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/group-chats/${chatId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch chat name");
      }

      const data = await response.json();
      return data.name;
    } catch (error) {
      console.error("Error fetching chat name:", error);
      return null;
    }
  };

  const handleCreateConversation = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewChatName("");
    setNewChatDescription("");
  };

  const fetchConversations = (jwtToken) => {
    const apiUrl = `http://localhost:8080/api/v1/user-to-groups/groups/${currentUser._id}`;

    fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Failed to fetch conversations");
        }
      })
      .then((conversationsData) => {
        const fetchChatNames = async () => {
          const updatedConversations = await Promise.all(
            conversationsData.map(async (conversation) => {
              const chatName = await fetchChatName(
                conversation.chatId,
                jwtToken
              );
              return {
                ...conversation,
                name: chatName,
              };
            })
          );
          return updatedConversations;
        };

        fetchChatNames().then((updatedConversations) => {
          setConversations(updatedConversations);
        });
      })
      .catch((error) => {
        console.error("Error fetching conversations:", error);
      });
  };

  // Function to fetch chat history by chatId
  const fetchChatHistory = (chatId, jwtToken) => {
    const url = `http://localhost:8080/api/v1/chat-histories/chat/${chatId}`;

    return fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Failed to fetch chat history");
        }
      })
      .catch((error) => {
        console.error("Error fetching chat history:", error);
        return [];
      });
  };

  // Update the conversation click handler
  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    fetchChatHistory(conversation.chatId, sessionStorage.getItem("jwtToken"))
      .then((history) => {
        setChatHistory(history);
      })
      .catch((error) => {
        console.error("Error fetching chat history:", error);
        setChatHistory([]);
      });

    socket.emit("join-room", {
      roomId: conversation.chatId,
      userId: currentUser._id,
      joinDate: new Date(),
      role: "fake role",
    });
  };

  const handleCreateChat = () => {
    const jwtToken = sessionStorage.getItem("jwtToken");

    if (jwtToken && newChatName && newChatDescription) {
      const url = `http://localhost:8080/api/v1/group-chats`;

      const newChatData = {
        name: newChatName,
        description: newChatDescription,
        host_id: currentUser._id,
        create_at: new Date(),
        update_at: new Date(),
      };

      fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newChatData),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to create chat");
          }
        })
        .then((data) => {
          console.log("Chat created:", data);

          // Fetch updated conversations
          fetchConversations(jwtToken);

          // Add current user to the user-to-group table
          const addUserToGroupUrl = `http://localhost:8080/api/v1/user-to-groups`;

          const userToGroupData = {
            user_id: currentUser._id,
            chat_id: data._id,
            role: "host",
          };

          fetch(addUserToGroupUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userToGroupData),
          })
            .then((response) => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error("Failed to add user to group");
              }
            })
            .then((userData) => {
              console.log("User added to group:", userData);
              handleCloseModal();
            })
            .catch((error) => {
              console.error("Error adding user to group:", error);
            });
        })
        .catch((error) => {
          console.error("Error creating chat:", error);
        });
    }
  };

  const handleJoinModal = () => {
    setIsJoinModalOpen(true);
  };

  const handleCloseJoinModal = () => {
    setIsJoinModalOpen(false);
    setJoinChatName("");
  };

  const handleJoinChatRequest = () => {
    const jwtToken = sessionStorage.getItem("jwtToken");

    if (jwtToken && joinChatName) {
      const getChatUrl = `http://localhost:8080/api/v1/group-chats/name/${joinChatName}`;

      fetch(getChatUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to find chat");
          }
        })
        .then((chatData) => {
          console.log("Chat found:", chatData);

          // Now, make an API call to add the current user to the group chat
          const addUserToGroupUrl = `http://localhost:8080/api/v1/user-to-groups`;

          const userToGroupData = {
            user_id: currentUser._id,
            chat_id: chatData._id,
            role: "participant",
          };

          fetch(addUserToGroupUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userToGroupData),
          })
            .then((response) => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error("Failed to join chat");
              }
            })
            .then((userData) => {
              console.log("User joined to group:", userData);
              fetchConversations(jwtToken); // Refresh conversations
              handleCloseJoinModal();
            })
            .catch((error) => {
              console.error("Error joining chat:", error);
            });
        })
        .catch((error) => {
          console.error("Error finding chat:", error);
        });
    }
  };

  useEffect(() => {
    socket.on("receive-message", (data) => {
      console.log("Received data:", data);
      const message = {
        _id: data._id,
        userId: data.userId,
        message: data.message,
        attachment: data.attachment,
      };
      console.log("Received message:", message);
      setChatHistory((prevChatHistory) => [...prevChatHistory, message]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  useEffect(() => {
    const jwtToken = sessionStorage.getItem("jwtToken");

    if (jwtToken) {
      fetch("http://localhost:8080/api/v1/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to fetch current user");
          }
        })
        .then((data) => {
          setCurrentUser(data);

          const conversationApiUrl = `http://localhost:8080/api/v1/user-to-groups/groups/${data._id}`;
          fetch(conversationApiUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${jwtToken}`,
              "Content-Type": "application/json",
            },
          })
            .then((response) => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error("Failed to fetch conversations");
              }
            })
            .then((conversationsData) => {
              const fetchChatNames = async () => {
                const updatedConversations = await Promise.all(
                  conversationsData.map(async (conversation) => {
                    const chatName = await fetchChatName(
                      conversation.chatId,
                      jwtToken
                    );
                    return {
                      ...conversation,
                      name: chatName,
                    };
                  })
                );
                return updatedConversations;
              };

              fetchChatNames().then((updatedConversations) => {
                setConversations(updatedConversations);
              });
            })
            .catch((error) => {
              console.error("Error fetching conversations:", error);
            });
        })
        .catch((error) => {
          console.error("Error fetching current user:", error);
          navigate("/");
        });
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;

    const newMessage = {
      groupChatId: selectedConversation.chatId,
      userId: currentUser._id,
      message: messageInput.trim(),
      attachment: null,
    };

    setChatHistory((prevChatHistory) => [...prevChatHistory, newMessage]);

    // console.log("Message sent:", newMessage);
    if (selectedConversation) {
      if (socket.connected) {
        socket.emit("send-message", newMessage);
      } else {
        console.log("Socket not connected");
      }
    }

    setMessageInput("");
  };

  return (
    <div className="chat-container">
      <div className="navigation-bar">
        <div className="user-section">
          <h2>
            {currentUser
              ? `Welcome, ${
                  currentUser.first_name + " " + currentUser.last_name
                }`
              : "Loading..."}
          </h2>
          <button
            className="create-conversation-icon"
            onClick={handleCreateConversation}
          >
            New chat
          </button>
          <button
            className="create-conversation-icon"
            onClick={handleJoinModal}
          >
            Join chat
          </button>
        </div>
        <div className="conversation-list">
          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              className={`conversation-item ${
                selectedConversation === conversation ? "active" : ""
              }`}
              onClick={() => handleConversationClick(conversation)}
            >
              {conversation.name}
            </div>
          ))}
        </div>
      </div>

      <div className="conversation-display">
        {selectedConversation ? (
          <>
            <div className="messages">
              {chatHistory.map((message, index) => (
                <div
                  key={`${message._id}-${index}`}
                  className={`message ${
                    message.userId === currentUser._id ? "me" : "other"
                  }`}
                >
                  {message.userId}: {message.message}
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
            <div className="message-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <button id="send-message-button" onClick={handleSendMessage}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-conversation">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* Join chat modal popup */}
      {isJoinModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseJoinModal}>
              &times;
            </span>
            <h2>Join Chat</h2>
            <input
              type="text"
              placeholder="Chat Name"
              value={joinChatName}
              onChange={(e) => setJoinChatName(e.target.value)}
            />
            <button onClick={handleJoinChatRequest}>Join</button>
          </div>
        </div>
      )}

      {/* New chat modal popup */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseModal}>
              &times;
            </span>
            <h2>Create New Chat</h2>
            <input
              type="text"
              placeholder="Chat Name"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
            />
            <textarea
              placeholder="Chat Description"
              value={newChatDescription}
              onChange={(e) => setNewChatDescription(e.target.value)}
            ></textarea>
            <button onClick={handleCreateChat}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
