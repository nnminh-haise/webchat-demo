import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./SentInvitation.css";

const SentInvitationsModal = ({ show, onClose, onFetchSentInvitations }) => {
  const showHideClassName = show
    ? "sent-invitation-modal display-block"
    : "sent-invitation-modal display-none";
  const [sentInvitations, setSentInvitations] = useState([]);

  console.log("[Sent invitation modal] Open modal");

  useEffect(() => {
    if (show) {
      const fetchInvitations = async () => {
        try {
          const invitations = await onFetchSentInvitations();
          setSentInvitations(Object.values(invitations));
        } catch (error) {
          console.error("Error fetching sent invitations:", error);
        }
      };

      fetchInvitations();
    }
  }, [show, onFetchSentInvitations]);

  const handleModalCloseEvent = () => {
    console.log("[Sent invitation modal] Modal close event");
    onClose();
  };

  return ReactDOM.createPortal(
    <div className={showHideClassName}>
      <div className="sent-invitation-modal-main">
        <h2>Sent Invitations:</h2>
        <div className="invitations-container">
          {sentInvitations.map((invitation) => (
            <div key={invitation._id} className="invitation-card">
              <p>
                <strong>Invitation to</strong>{" "}
                {invitation.recipientId.firstName +
                  " " +
                  invitation.recipientId.lastName}
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
          className="sent-invitation-modal-close-btn"
          onClick={handleModalCloseEvent}
        >
          Close
        </button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default SentInvitationsModal;
