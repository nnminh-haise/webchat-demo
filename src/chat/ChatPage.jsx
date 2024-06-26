import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatPage.css";
import io from "socket.io-client";
import axios from "axios";
import CreateGroupChatModal from "./modals/CreateGroupChat";
import SentInvitationsModal from "./modals/SentInvitation";
import ReceivedInvitationsModal from "./modals/ReceivedInvitations";

/**
 * TODO: implement disconnect socket server when user leave chat page
 * TODO: resolve current conversation lost when page reload
 * TODO: implement sending message to the server
 */
// * [Const] Backend server URL
const BACKEND_SERVER_URL = "http://localhost:8081";
const FETCH_USER_PROFILE = `${BACKEND_SERVER_URL}/api/v1/users/me`;
const FETCH_CONVERSATIONS_URL = `${BACKEND_SERVER_URL}/api/v1/user-to-groups/groups`;
const FETCH_SENT_INVITAIONS_URL = `${BACKEND_SERVER_URL}/api/v1/invitations/sent`;
const FETCH_RECEIVED_INVITAIONS_URL = `${BACKEND_SERVER_URL}/api/v1/invitations/received`;

let notificationSocket = null;

let socket = null;

const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

const connectToNotificationServer = (accessToken) => {
  notificationSocket = io(BACKEND_SERVER_URL, {
    auth: {
      Bearer: accessToken,
    },
  });
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

const leaveRoom = (roomId, userId) => {
  if (!socket) {
    console.error("Socket is not connected");
    return;
  }

  if (!roomId || !userId) {
    return;
  }

  socket.emit("leave-room", { roomId, userId });
};

const sendMessage = (roomId, userId, message) => {
  if (!socket) {
    console.error("Socket is not connected");
    return;
  }

  if (!roomId || !userId || !message) {
    return;
  }

  const payload = {
    groupChatId: roomId,
    userId,
    message,
    attachment: null,
  };
  socket.emit("send-message", payload);
};

// * [Func] Fetch user profile base on the current access token in the local storage
const fetchUserProfile = async () => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return null;
    }

    const response = await axios.get(FETCH_USER_PROFILE, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return null;
    }
  }
};

const ChatPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [newGroupChatCreated, setNewGroupChatCreated] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [showCreateChatModal, setShowCreateChatModal] = useState(false);
  const [showSentInvitationsModal, setShowSentInvitationsModal] =
    useState(false);
  const [showReceivedInvitationsModal, setReceivedInvitationModals] =
    useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // * [Hook] Fetch user profile when the page is loaded
  useEffect(() => {
    fetchUserProfile().then((user) => {
      if (!user) {
        navigate("/");
        return;
      }

      localStorage.setItem("userId", user._id);
      setCurrentUser(user);
      connectToNotificationServer(getAccessToken());
    });
  }, []);

  // * [Hook] Handle page reload event
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUserProfile().then((user) => {
        if (!user) {
          navigate("/");
          return;
        }

        localStorage.setItem("userId", user._id);
        setCurrentUser(user);
        connectToNotificationServer(getAccessToken());
      });
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  // * [Hook] Hook fetch conversations when the current user is loaded or a new group chat is created
  useEffect(() => {
    // * [Func] Fetch conversations which the current user is participated in
    const fetchConversations = async () => {
      if (!currentUser) {
        console.log("[fetchConversations] Current user is not available");
        return;
      }

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
    };

    fetchConversations();
  }, [currentUser, newGroupChatCreated]);

  // * [Func] Handle conversation selection event
  const handleConversationClick = (conversation) => {
    if (currentConversation && conversation._id === currentConversation._id) {
      return;
    }

    setMessages([]);
    if (currentConversation) {
      leaveRoom(currentConversation.groupChatId._id, currentUser._id);
    }
    setCurrentConversation(conversation);
    localStorage.setItem("currentConversation", conversation.groupChatId._id);
    connectToSocket(getAccessToken());
    joinRoom(conversation.groupChatId._id, currentUser._id);
  };

  // * [Hook] Listen to the incoming message
  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.on("receive-message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
  }, [socket]);

  // * [Func] Handle send message event
  const handleSendMessageEvent = () => {
    const newMessage = {
      userId: currentUser,
      message: messageInput,
      groupChatId: currentConversation.groupChatId._id,
      createAt: new Date().toISOString(),
      attachment: null,
    };
    setMessages((prevMessages) => {
      const messages = [...prevMessages, newMessage];
      return messages;
    });
    sendMessage(
      currentConversation.groupChatId._id,
      currentUser._id,
      messageInput
    );
    setMessageInput("");
  };

  // * [Hook] Notification server hook
  useEffect(() => {
    if (!notificationSocket) {
      return;
    }

    notificationSocket.on("new-invitation", (invitation) => {
      console.log("[notificationSocket] New invitation:", invitation);
    });
  }, [notificationSocket]);

  // * [Func] Fetch sent invitations
  const fetchSentInvitations = async () => {
    if (!currentUser) {
      console.log("[fetchSentInvitations] Current user is not available");
      return;
    }

    try {
      const accessToken = getAccessToken();
      const url = `${FETCH_CONVERSATIONS_URL}/sent`;
      console.log(
        "[fetchSentInvitations] Fetching sent invitations from:",
        url
      );
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const conversationsArray = Object.values(response.data);
      console.log(
        "[fetchSentInvitations] Sent invitations:",
        conversationsArray
      );
      setConversations(conversationsArray);
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
    }
  };

  // * [Hook] Handle page reload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      setTimeout(console.log("reload page!"), 100000000000);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // * [Func] Handle sign-out event
  const handleSignOutEvent = () => {
    // if (
    //   !currentConversation ||
    //   localStorage.getItem("currentConversation") === null
    // ) {
    //   localStorage.removeItem("accessToken");
    //   navigate("/");
    //   return;
    // }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentConversation");
    if (currentConversation && currentUser) {
      leaveRoom(currentConversation.groupChatId._id, currentUser._id);
    }
    notificationSocket.disconnect();
    navigate("/");
  };

  // * [Func] Handle fetch sent invitations event
  const handleFetchSentInvitaionsEvent = async () => {
    console.log("[handleFetchSentInvitaionsEvent] Fetching sent invitations");
    try {
      const response = await axios.get(FETCH_SENT_INVITAIONS_URL, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status >= 401) {
        console.error("Error fetching sent invitations:", error.response.data);
      }
      return null;
    }
  };

  // * [Func] Handle fetch received invitations event
  const handleFetchReceivedInvitationsEvent = async () => {
    console.log(
      "[handleFetchReceivedInvitationsEvent] Fetching received invitations"
    );
    try {
      const response = await axios.get(FETCH_RECEIVED_INVITAIONS_URL, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status >= 401) {
        console.error(
          "Error fetching received invitations:",
          error.response.data
        );
      }
      return null;
    }
  };

  return (
    <div className="chat-page-container">
      <div className="user-section">
        {currentUser ? (
          // * [UI] User profile section
          <div className="profile-section">
            <h2>
              {currentUser.first_name} {currentUser.last_name}
            </h2>
            <p>@{currentUser.username}</p>
            {/* // * [UI] Navigation bar */}
            <div className="nav-bar">
              <button className="sign-out-btn" onClick={handleSignOutEvent}>
                Sign out
              </button>
              <button
                className="create-group-chat-btn"
                onClick={() => {
                  setShowCreateChatModal(true);
                }}
              >
                Create group chat
              </button>
              {/* // * [UI] Create group chat modal */}
              <CreateGroupChatModal
                show={showCreateChatModal}
                handleClose={() => {
                  setShowCreateChatModal(false);
                }}
                onNewGroupChatCreated={() => {
                  setNewGroupChatCreated(true);
                }}
                notificationSocket={notificationSocket}
              >
                <p>This is the modal content!</p>
              </CreateGroupChatModal>
              <button className="notification-btn">Notifications</button>
              <button
                className="sent-invitaion-btn"
                onClick={() => {
                  setShowSentInvitationsModal(true);
                }}
              >
                Sent Invitations
              </button>
              <SentInvitationsModal
                show={showSentInvitationsModal}
                onClose={() => setShowSentInvitationsModal(false)}
                onFetchSentInvitations={handleFetchSentInvitaionsEvent}
              ></SentInvitationsModal>
              <button
                className="received-invitaion-btn"
                onClick={() => {
                  setReceivedInvitationModals(true);
                }}
              >
                Received Invitations
              </button>
              <ReceivedInvitationsModal
                show={showReceivedInvitationsModal}
                onClose={() => setReceivedInvitationModals(false)}
                onFetchReceivedInvitations={handleFetchReceivedInvitationsEvent}
              ></ReceivedInvitationsModal>
            </div>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
        {/* // * [UI] Conversation list section */}
        <div className="conversation-list-section">
          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              className="conversation-item"
              onClick={() => handleConversationClick(conversation)}
            >
              {conversation.groupChatId?.name}
            </div>
          ))}
        </div>
      </div>
      {/* // * [UI] Chat section */}
      <div className="chat-section">
        {/* // * [UI] Chat header section */}
        <div className="messages-section">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                !message.userId || message.userId._id !== currentUser._id
                  ? "receipent"
                  : "sender"
              }`}
            >
              {!message.userId || message.userId._id !== currentUser._id ? (
                <p className="sender-name">{message.userId.lastName}</p>
              ) : null}
              <p
                className={`message-text ${
                  !message.userId || message.userId._id !== currentUser._id
                    ? "receipent"
                    : "sender"
                }`}
              >
                {message.message} - {message.createAt}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* // * [UI] Message input section */}
        <div className="message-input-section">
          <input
            type="text"
            placeholder="Type your message here..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button className="send-message-btn" onClick={handleSendMessageEvent}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
