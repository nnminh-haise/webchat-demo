import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./ReceivedInvitations.css";

const ReceivedInvitations = ({ show, onClose, onFetchReceivedInvitations }) => {
  const showHideClassName = show
    ? "received-invitation-modal display-block"
    : "received-invitation-modal display-none";

  const [receivedInvitations, setReceivedInvitations] = useState([]);

  useEffect(() => {
    if (show) {
      const fetchReceivedInvitations = async () => {
        try {
          const receivedInvitations = await onFetchReceivedInvitations();
          setReceivedInvitations(Object.values(receivedInvitations));
        } catch (error) {
          console.error("Error fetching received invitations:", error);
        }
      };

      fetchReceivedInvitations();
    }
  }, [show, onFetchReceivedInvitations]);

  const handleModalCloseEvent = () => {
    console.log("[Sent invitation modal] Modal close event");
    onClose();
  };

  return ReactDOM.createPortal(
    <div className={showHideClassName}>
      <div className="received-invitation-modal-main">
        <h2>Received Invitations:</h2>
        <div className="invitations-container">
          {receivedInvitations.map((invitation) => (
            <div key={invitation._id} className="invitation-card">
              <p>
                <strong>Joinning Group Chat:</strong>{" "}
                {invitation.groupChatId.name}
              </p>
              <p>
                <strong>Invitation from</strong>{" "}
                {invitation.inviterId.firstName +
                  " " +
                  invitation.inviterId.lastName}
              </p>
              <p>
                <strong>Reason:</strong> {invitation.inviteReason}
              </p>
              <p>
                <strong>Status:</strong> {invitation.status}
              </p>
            </div>
          ))}
        </div>
        <button
          className="received-invitation-modal-close-btn"
          onClick={handleModalCloseEvent}
        >
          Close
        </button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default ReceivedInvitations;
