import { useState } from "react";
import DetailRow from "../Utils/DetailRow";
import { useFirebase } from "@/lib/firebaseContext";
import Notification from "../Notifications/notifications";

const SupportTickets = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { supportTickets } = useFirebase();
  const [filterStatus, setFilterStatus] = useState("all");

  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState("success");
  const [notificationMessage, setNotificationMessage] = useState("N/a");
  const [loading, setLoading] = useState(false);

    const closeTicket = async (ticket) => {
      console.log("Data:", ticket);
      setLoading(true);

      try {
        const response = await fetch("/api/closeTicket", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ticket}),
        });

        const data = await response.json();

        if (response.ok) {
          setNotificationMessage(
            "Ticket status updated successfully."
          );
          setNotificationType("success");
          setShowNotification(true);
          setLoading(false);
        } else {
          console.error("Error updating ticket status:", data);
          setNotificationMessage("Error updating ticket status");
          setNotificationType("error");
          setShowNotification(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("An error occurred:", error);
        setNotificationMessage("An error occurred");
        setNotificationType("error");
        setLoading(false);
        setShowNotification(true);
      } finally {
        setTimeout(() => setShowNotification(false), 5000);
      }
    };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-lg lg:text-2xl font-bold text-blue-900 mb-6">
        Support Tickets
      </h2>

      <div className="mb-4 flex justify-end">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1 text-sm border rounded bg-white text-gray-700 cursor-pointer"
        >
          {["all", "open", "closed"].map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {supportTickets
          .filter((ticket) =>
            filterStatus === "all" ? true : ticket.status === filterStatus
          )
          .map((ticket) => (
            <div
              key={ticket.ticketID}
              className="bg-white shadow-sm rounded-lg p-4 border border-gray-100"
            >
              <div className="space-y-2">
                <DetailRow label="Ticket ID" value={ticket.ticketID} />
                <DetailRow label="Name" value={ticket.name} />
                <DetailRow label="Subject" value={ticket.subject} />
                <DetailRow
                  label="Status"
                  value={
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-medium ${
                        ticket.status === "open"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  }
                />
              </div>
              <button
                onClick={() => setSelectedTicket(ticket)}
                className="text-blue-600 hover:underline text-sm mt-3"
              >
                View
              </button>
            </div>
          ))}
      </div>

      {/* Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg relative">
            <h3 className="text-lg font-semibold mb-2">
              Message from {selectedTicket.name}
            </h3>
            <p className="text-sm lg:text-base text-gray-700 mb-4 whitespace-pre-wrap">
              {selectedTicket.message}
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={selectedTicket.status !== "open"}
                onClick={() => {
                  closeTicket(selectedTicket);
                }}
                className={`px-4 py-2 text-sm rounded min-w-40 flex justify-center items-center ${
                  selectedTicket.status === "open"
                    ? "bg-blue-800 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                ) : (
                  <div className="text-white text-center h-6">
                    Mark as Resolved
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotification && (
        <Notification
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          show={true}
        />
      )}
    </div>
  );
};

export default SupportTickets;
