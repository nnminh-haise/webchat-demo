import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./CreateGroupChat.css";
import io from "socket.io-client";
import axios from "axios";

const BACKEND_SERVER_URL = "http://localhost:8081";
const CREATE_GROUP_CHAT_URL = `${BACKEND_SERVER_URL}/api/v1/group-chats`;
const SEND_INVITATION_URL = `${BACKEND_SERVER_URL}/api/v1/invitations`;

const CreateGroupChatModal = ({
  show,
  handleClose,
  onNewGroupChatCreated,
  notificationSocket,
}) => {
  if (!notificationSocket) {
    console.error("[Create group chat modal] No notification socket");
  }

  const showHideClassName = show ? "modal display-block" : "modal display-none";
  const [groupChatName, setGroupChatName] = useState("");
  const [description, setDescription] = useState("");
  const [invitationReason, setInvitationReason] = useState("");
  const [usernames, setUsernames] = useState("");
  const [foundUsers, setFoundUsers] = useState(new Map());
  const [invitingUsers, setInvitingUsers] = useState([]);
  const [failedInvitations, setFailedInvitations] = useState(new Map());
  const [successInvitations, setSuccessInvitations] = useState(new Map());
  const [invitationResultTabs, setInvitationResultTabs] = useState("success");
  const [createGroupChatResult, setCreateGroupChatResult] = useState(null);

  // * [Hook] Notification server hook for error invitation
  useEffect(() => {
    if (!notificationSocket) {
      return;
    }

    notificationSocket.on("error-invitation", ({ invitation, error }) => {
      setFailedInvitations((prev) => {
        if (!prev) {
          const newMap = new Map();
          newMap.set(invitation.recipientId, { invitation, error });
          return newMap;
        }
        if (prev.has(invitation.recipientId)) {
          return prev;
        }
        prev.set(invitation.recipientId, { invitation, error });
        return prev;
      });
    });
    notificationSocket.on("success-invitation", (response) => {
      setSuccessInvitations((prev) => {
        if (!prev) {
          const newMap = new Map();
          newMap.set(response._id, response);
          return newMap;
        }
        if (prev.has(response._id)) {
          return prev;
        }
        prev.set(response._id, response);
        return prev;
      });
    });
  }, [notificationSocket]);

  useEffect(() => {
    console.log("failedInvitations:", failedInvitations);
    console.log("successInvitations:", successInvitations);
  }, [failedInvitations, successInvitations]);

  // * [Func] Handle create group chat event
  const handleCreateGroupChatEvent = () => {
    if (!groupChatName) {
      alert("Please fill in the group chat name.");
      return;
    }

    // * [Func] Create group chat API
    const createGroupChat = async () => {
      const createGroupChatPayload = {
        name: groupChatName,
        description: description,
        hostId: localStorage.getItem("userId"),
        creatorId: localStorage.getItem("userId"),
      };
      try {
        const response = await axios.post(
          CREATE_GROUP_CHAT_URL,
          createGroupChatPayload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setCreateGroupChatResult({
          message: "Group chat created successfully",
          data: response.data,
        });
        return response.data;
      } catch (error) {
        if (error.response.status >= 400) {
          setCreateGroupChatResult(error.response.data);
        }
        return null;
      }
    };

    // * [Exec] Create group chat
    createGroupChat().then((groupChat) => {
      if (!groupChat) {
        return;
      }

      onNewGroupChatCreated();
    });
  };

  // * [Func] Handle sent invitation
  const handleSentInvitation = async (groupChat, invitingUsers) => {
    for (const user of invitingUsers) {
      const invitationPayload = {
        inviterId: localStorage.getItem("userId"),
        recipientId: user._id,
        groupChatId: groupChat._id,
        inviteReason: invitationReason,
      };
      notificationSocket.emit("incoming-invitation", invitationPayload);
    }
  };

  // * [Func] Handle invite users event
  const handleInviteUsersEvent = async () => {
    if (!invitingUsers || !foundUsers || invitingUsers.length === 0) {
      alert("No valid username found");
      return;
    }
    if (
      !createGroupChatResult ||
      createGroupChatResult?.statusCode ||
      !createGroupChatResult.data
    ) {
      alert("Invalid group chat!");
      return;
    }
    const newGroupChat = createGroupChatResult.data;
    await handleSentInvitation(newGroupChat, invitingUsers);
  };

  // * [Func] Handle finding users
  const handleFindingUsers = (usernameList) => {
    if (!usernameList) {
      return;
    }

    const usernamesArr = usernameList
      .split(",")
      .map((username) => username.trim());
    usernamesArr.forEach((username) => {
      notificationSocket.emit("find-user-by-username", username);
      notificationSocket.on("user-found", (user) => {
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
  };

  // * [Func] Handle close button
  const handleCloseButton = () => {
    console.log("[Create group chat modal] Executed handleCloseButton");
    setGroupChatName("");
    setDescription("");
    setUsernames("");
    if (notificationSocket) {
      notificationSocket.disconnect();
    }
    setFoundUsers(new Map());
    setInvitingUsers([]);
    setInvitationReason("");
    setSuccessInvitations([]);
    setFailedInvitations([]);
    setInvitationResultTabs("success");
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
          placeholder="Invitation reason..."
          value={invitationReason}
          onChange={(e) => setInvitationReason(e.target.value)}
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

        <div className="option-btns">
          <button onClick={handleCreateGroupChatEvent}>Create</button>
          <button onClick={handleInviteUsersEvent}>Invite</button>
        </div>
        <div className="create-group-chat-result">
          {createGroupChatResult ? (
            <p>{createGroupChatResult.message}</p>
          ) : (
            <p></p>
          )}
        </div>
        <div className="invitation-result-container">
          <h2>Inviting Result</h2>
          <div className="result-tabs">
            <button onClick={() => setInvitationResultTabs("success")}>
              Success
            </button>
            <button onClick={() => setInvitationResultTabs("failed")}>
              Failed
            </button>
          </div>
          <div className="result-contents">
            <div
              className={`tab-content ${
                invitationResultTabs === "success" ? "active" : ""
              }`}
            >
              <ul>
                {successInvitations.size < 1 ? (
                  <li>No success invitation</li>
                ) : (
                  Array.from(successInvitations.values()).map(
                    ([key, value]) => {
                      return (
                        <li key={key}>
                          Invited {value.recipientId} successfully
                        </li>
                      );
                    }
                  )
                  // Object.values(successInvitations).map((invitation) => {
                  //   console.log("invitation:", invitation);
                  //   return (
                  //     <li key={invitation._id}>
                  //       Invited {invitation.recipientId} successfully
                  //     </li>
                  //   );
                  // })
                )}
              </ul>
            </div>
            <div
              className={`tab-content ${
                invitationResultTabs === "failed" ? "active" : ""
              }`}
            >
              <ul>
                <p>Failed</p>
                {/* {!successInvitations ? (
                  <li>Empty failed invitation</li>
                ) : (
                  Object.values(failedInvitations).map((data) => {
                    const { invitation, error } = data;
                    console.log("invitation:", invitation);
                    console.log("error:", error);
                    return (
                      <li key={invitation.recipientId}>
                        Failed to invite {invitation.recipientId} due to {error}
                      </li>
                    );
                  })
                )} */}
              </ul>
            </div>
          </div>
        </div>
        <button onClick={handleCloseButton}>Close</button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default CreateGroupChatModal;
