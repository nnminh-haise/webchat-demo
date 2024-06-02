import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./ReceivedInvitations.css";

const ReceivedInvitations = ({ show, onClose }) => {
  const showHideClassName = show
    ? "received-invitation-modal display-block"
    : "received-invitation-modal display-none";

  const handleModalCloseEvent = () => {
    console.log("[Sent invitation modal] Modal close event");
    onClose();
  };

  return ReactDOM.createPortal(
    <div className={showHideClassName}>
      <div className="received-invitation-modal-main">
        <h2>Received Invitations:</h2>
        <div className="invitations-container">
          <div className="invitation-card">
            <p>
              <strong>Invitation from</strong> John Doe
            </p>
            <p>
              <strong>Reason:</strong> Let's chat
            </p>
            <p>
              <strong>Status:</strong> Pending
            </p>
          </div>
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
