import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./SentInvitation.css";

const SentInvitationsModal = ({ show, onClose, onFetchSentInvitations }) => {
  const showHideClassName = show ? "modal display-block" : "modal display-none";
  const [sentInvitations, setSentInvitations] = useState([]);

  console.log("[Sent invitation modal] Open modal");

  useEffect(() => {
    if (show) {
      const fetchInvitations = async () => {
        try {
          const invitations = await onFetchSentInvitations();
          console.log("[Sent invitation modal] Invitations: ", invitations);
          console.log(
            "[Sent invitation modal] Data type of invitations: ",
            typeof invitations
          );
          console.log(
            "[Sent invitation modal] Is array: ",
            Array.isArray(invitations)
          );

          // If invitations is an object, convert it to an array
          if (
            invitations &&
            typeof invitations === "object" &&
            !Array.isArray(invitations)
          ) {
            const invitationsArray = Object.values(invitations);
            setSentInvitations(invitationsArray);
          } else if (Array.isArray(invitations)) {
            setSentInvitations(invitations);
          } else {
            console.error("Error: fetched data is not an array or object");
          }
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
      <div className="modal-main">
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
        <button onClick={handleModalCloseEvent}>Close</button>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default SentInvitationsModal;
