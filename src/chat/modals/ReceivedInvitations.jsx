import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./ReceivedInvitations.css";
import axios from "axios";

const REPLY_INVITATION_URL = "http://localhost:8081/api/v1/invitations/reply";

// TODO: The loading of the pending invitations is not working properly. The receivedInvitations state is not being updated after the first fetch.
const ReceivedInvitations = ({ show, onClose, onFetchReceivedInvitations }) => {
  const showHideClassName = show
    ? "received-invitation-modal display-block"
    : "received-invitation-modal display-none";

  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [filteredInvitations, setFilteredInvitations] = useState([]);
  const [updatedInvitations, setUpdatedInvitations] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");
  const [replyingInvitationId, setReplyingInvitationId] = useState(null);
  const [showDenyReasonInputForm, setShowDenyReasonInputForm] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  // * [Hook] Fetch received invitations when modal is shown
  useEffect(() => {
    if (!show) {
      return;
    }
    const fetchReceivedInvitations = async () => {
      try {
        const response = await onFetchReceivedInvitations();
        setReceivedInvitations(Object.values(response));
      } catch (error) {
        console.error("Error fetching received invitations:", error);
      }
    };
    fetchReceivedInvitations();
  }, [show, onFetchReceivedInvitations, updatedInvitations]);

  // * [Hook] Filter received invitations based on active tab
  useEffect(() => {
    if (!receivedInvitations || receivedInvitations.length <= 0) {
      return;
    }
    setFilteredInvitations(
      receivedInvitations.filter(
        (invitation) => invitation.status === activeTab.toLowerCase()
      )
    );
  }, [receivedInvitations, activeTab, updatedInvitations]);

  // * [API] Accept invitation
  const acceptInvitation = async (invitationId) => {
    try {
      const response = await axios.patch(
        REPLY_INVITATION_URL,
        {
          invitationId: invitationId,
          status: "accepted",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error("Error accepting invitation:", error.response.data);
      }
      return null;
    }
  };

  // * [API] Deny invitation
  const denyInvitation = async (invitationId) => {
    if (!invitationId) {
      return null;
    }
    if (!denyReason) {
      denyReason = "Your invitation was denied";
    }
    try {
      const response = await axios.patch(
        REPLY_INVITATION_URL,
        {
          invitationId: invitationId,
          status: "denied",
          denyReason: denyReason,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error("Error denying invitation:", error.response.data);
      }
      return null;
    }
  };

  // * [Func] Handle invitation accepted
  const handleInvitationAccepted = async (invitationId) => {
    console.log("[Sent invitation modal] Invitation accepted:", invitationId);

    const response = await acceptInvitation(invitationId);
    console.log("Response:", response);
  };

  // * [Func] Handle invitation denied
  const handleInvitationDenied = async (invitationId) => {
    console.log("[Sent invitation modal] Invitation denied:", invitationId);

    const response = await denyInvitation(invitationId);
    console.log("Response:", response);
  };

  // * [Func] Handle modal close event
  const handleModalCloseEvent = () => {
    console.log("[Sent invitation modal] Modal close event");
    setDenyReason("");
    setReceivedInvitations([]);
    setFilteredInvitations([]);
    setUpdatedInvitations(false);
    setReplyingInvitationId(null);
    setShowDenyReasonInputForm(false);
    setActiveTab("Pending");
    onClose();
  };

  return ReactDOM.createPortal(
    <div className={showHideClassName}>
      <div className="received-invitation-modal-main">
        <h2>Received Invitations</h2>
        <div className="tabs">
          <button
            className={activeTab === "Pending" ? "active" : ""}
            onClick={() => setActiveTab("Pending")}
          >
            Pending
          </button>
          <button
            className={activeTab === "Accepted" ? "active" : ""}
            onClick={() => setActiveTab("Accepted")}
          >
            Accepted
          </button>
          <button
            className={activeTab === "Denied" ? "active" : ""}
            onClick={() => setActiveTab("Denied")}
          >
            Denied
          </button>
        </div>
        <div className="invitations-container">
          {filteredInvitations.length <= 0 ? (
            <p className="empty-message">Empty</p>
          ) : (
            filteredInvitations.map((invitation) => (
              <div key={invitation._id} className="invitation-card">
                <p>
                  <strong>Joining Group Chat:</strong>{" "}
                  {invitation.groupChatId.name}
                </p>
                <p>
                  <strong>Invitation from:</strong>{" "}
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
                {activeTab === "Pending" && (
                  <div className="replying-section">
                    <div className="replying-btns">
                      <button
                        className="received-invitation-accept-btn"
                        onClick={() => {
                          handleInvitationAccepted.bind(this, invitation._id);
                          setUpdatedInvitations(true);
                        }}
                      >
                        Accept
                      </button>
                      <button
                        className="recevied-invitation-deny-btn"
                        onClick={() => {
                          setReplyingInvitationId(invitation._id);
                          setShowDenyReasonInputForm(!showDenyReasonInputForm);
                        }}
                      >
                        {showDenyReasonInputForm &&
                        replyingInvitationId === invitation._id
                          ? "Cancel"
                          : "Deny"}
                      </button>
                    </div>
                    <div>
                      {showDenyReasonInputForm &&
                      replyingInvitationId === invitation._id ? (
                        <div className="received-invitation deny-invitation-input-form">
                          <input
                            type="text"
                            placeholder="Deny Reason"
                            className="deny-reason-input"
                          />
                          <button className="deny-reason-submit-btn">
                            Sent
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
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
