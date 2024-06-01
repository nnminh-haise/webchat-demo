import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./CreateGroupChat.css";
import io from "socket.io-client";
import axios from "axios";

const BACKEND_SERVER_URL = "http://localhost:8081";
const CREATE_GROUP_CHAT_URL = `${BACKEND_SERVER_URL}/api/v1/group-chats`;

let socket = null;

const CreateGroupChatModal = ({ show, handleClose, onNewGroupChatCreated }) => {
  const [socketConnection, setSocketConnection] = useState(false);

  if (show && socketConnection === false) {
    socket = io(BACKEND_SERVER_URL, {
      auth: {
        Bearer: localStorage.getItem("accessToken"),
      },
    });
    console.log("connected to socket");
    setSocketConnection(true);
  }

  const showHideClassName = show ? "modal display-block" : "modal display-none";
  const [groupChatName, setGroupChatName] = useState("");
  const [description, setDescription] = useState("");
  const [usernames, setUsernames] = useState("");
  const [foundUsers, setFoundUsers] = useState(new Map());
  const [invitingUsers, setInvitingUsers] = useState([]);

  const handleCreateGroupChatEvent = () => {
    if (!groupChatName) {
      alert("Please fill in the group chat name.");
      return;
    }

    const createGroupChatPayload = {
      name: groupChatName,
      description: description,
      hostId: localStorage.getItem("userId"),
      creatorId: localStorage.getItem("userId"),
    };
    try {
      const response = axios.post(
        CREATE_GROUP_CHAT_URL,
        createGroupChatPayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setTimeout(() => onNewGroupChatCreated(), 100);
    } catch (error) {
      console.error(error);
      if (error.response.status >= 400) {
        console.error(error.response.data);
      }
    }

    handleCloseButton();
  };

  const handleFindingUsers = (usernameList) => {
    if (!usernameList) {
      return;
    }

    console.log("usernameList:", usernameList);

    const usernamesArr = usernameList
      .split(",")
      .map((username) => username.trim());
    usernamesArr.forEach((username) => {
      socket.emit("find-user-by-username", username);
      socket.on("user-found", (user) => {
        if (!user._id) {
          return;
        }

        if (foundUsers.has(user._id)) {
          return;
        }

        setFoundUsers((prev) => {
          if (prev.has(user._id)) {
            return prev;
          }
          prev.set(user._id, user);
          setInvitingUsers((prev) => [...prev, user]);
          return prev;
        });
        return;
      });
    });
    for (let [key, value] of foundUsers.entries()) {
      if (!usernamesArr.includes(value.username)) {
        foundUsers.delete(key);
        setInvitingUsers((prev) =>
          prev.filter((user) => user.username !== value.username)
        );
      }
    }
    console.log("founded:", foundUsers);
  };

  const handleCloseButton = () => {
    setGroupChatName("");
    setDescription("");
    setUsernames("");
    if (socket) {
      socket.disconnect();
    }
    setSocketConnection(false);
    setFoundUsers(new Map());
    handleClose();
  };

  return ReactDOM.createPortal(
    <div className={showHideClassName}>
      <div className="modal-main">
        <h2>Create Group Chat</h2>
        <input
          type="text"
          placeholder="Type group chat name..."
          value={groupChatName}
          onChange={(e) => setGroupChatName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Type group chat description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter usernames separated by comma. Ex: username1, username2,..."
          value={usernames}
          onChange={(e) => {
            setUsernames(e.target.value);
            handleFindingUsers(e.target.value);
          }}
        />

        <div className="found-users">
          <h3>Inviting Users:</h3>
          <ul>
            {invitingUsers.map((user) => {
              return (
                <li key={user._id}>
                  {user.first_name} {user.last_name} (@{user.username})
                </li>
              );
            })}
          </ul>
        </div>

        <button onClick={handleCreateGroupChatEvent}>Create</button>
        <button onClick={handleCloseButton}>Close</button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default CreateGroupChatModal;
