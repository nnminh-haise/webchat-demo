import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./CreateGroupChat.css";
import io from "socket.io-client";

let socket = null;

const CreateGroupChatModal = ({ show, handleClose, handleCreate }) => {
  const BACKEND_SERVER_URL = "http://localhost:8081";
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

  const handleSubmit = () => {
    if (groupChatName) {
      handleCreate(groupChatName, description, usernames);
      handleCloseButton();
    } else {
      alert("Please fill in both fields.");
    }
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
          <h3>Found Users:</h3>
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

        <button onClick={handleSubmit}>Create</button>
        <button onClick={handleCloseButton}>Close</button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default CreateGroupChatModal;
