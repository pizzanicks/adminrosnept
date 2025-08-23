import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import  db  from "../../lib/firebase";
// import Sidebar from "../Sidebar";
// import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

import Notification from "../Notifications/notifications";
import { useFirebase } from "@/lib/firebaseContext";

const DepositRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [confirmApproveAction, setConfirmApproveAction] = useState(false);
  const [confirmDeclineAction, setConfirmDeclineAction] = useState(false);
  const {allDepositReq} = useFirebase();


    // NOTIFICATION
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] = useState('success');
    const [notificationMessage, setNotificationMessage] = useState('N/a');
    const [approving, setApproving] = useState(false);
    const [declining, setDeclining] = useState(false);

  console.log("reeqqq:", allDepositReq);

useEffect(() => {
  const fetchDepositsDirectly = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/depositRequests');
      if (response.ok) {
        const depositData = await response.json();
        setFilteredRequests(depositData);
        setAllDepositReq(depositData); // Also update context if needed
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchDepositsDirectly();
  const interval = setInterval(fetchDepositsDirectly, 3000);
  return () => clearInterval(interval);
}, []);


  const handleSearch = (value) => {
    setSearch(value);

    if (!value) {
      setFilteredRequests(allDepositReq);
      return;
    }

    const lowerValue = value.toLowerCase();
    setFilteredRequests(
      allDepositReq.filter((req) => {
        const userId = req?.userId?.toLowerCase() || "";
        const status = req?.status?.toLowerCase() || "";
        const method = req?.selectedWallet?.method?.toLowerCase() || "";

        return (
          userId.includes(lowerValue) ||
          status.includes(lowerValue) ||
          method.includes(lowerValue)
        );
      })
    );
  };

  console.log("data:", filteredRequests)


  const approveTransaction = async () => {

    // console.log("slectreqq:", selectedReq);
    setApproving(true);
    
    try {
      const response = await fetch("/api/approveTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedReq }),
      });

      if (!response.ok) {
        setNotificationMessage("Failed to approve transaction.");
        setNotificationType("error");
        setShowNotification(true);
        setApproving(false);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);

        return;
      }

      const data = await response.json();

      setNotificationMessage("Transaction approved successfully.");
      setNotificationType("success");
      setShowNotification(true);
      setApproving(false);
      setConfirmApproveAction(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      const emailResponse = await fetch("/api/mail/sendDepositApprovalMail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedReq }),
      });

      if (!emailResponse.ok) {
        // console.log("Failed to send email notification");
        
      }
      // console.log(
      //   "Email sent to admin successfully:",
      //   await emailResponse.json()
      // );

      return data;
    } catch (error) {
      console.error('Error approving transaction:', error);
      setNotificationMessage('An error occurred while approving the transaction.');
      setNotificationType('error');
      setShowNotification(true);
      setApproving(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  const declineTransaction = async () => {

    // console.log("slectreqq:", selectedReq);
    setDeclining(true);

    try {
      const response = await fetch("/api/declineTransaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedReq }),
      });
  
      if (!response.ok) {
        setNotificationMessage('Failed to decline transaction.');
        setNotificationType('error');
        setShowNotification(true);
        setDeclining(false);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
  
        return;
      }
  
      const data = await response.json();
  
      setNotificationMessage('Transaction declined successfully.');
      setNotificationType('success');
      setShowNotification(true);
      setDeclining(false);
      setConfirmDeclineAction(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error declining transaction:', error);
      setNotificationMessage('An error occurred while declining the transaction.');
      setNotificationType('error');
      setShowNotification(true);
      setDeclining(false);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };


  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const dateObj = timestamp?.toDate
        ? timestamp.toDate()
        : new Date(timestamp);
      return dateObj.toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex">
      {/* <Sidebar /> */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Deposit Requests</h1>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border p-2 rounded mb-4 w-full max-w-sm"
        />

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRequests?.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-8 text-gray-500"
                  >
                    No deposit requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(
                        b.createdAt?.toDate
                          ? b.createdAt.toDate()
                          : b.createdAt
                      ) -
                      new Date(
                        a.createdAt?.toDate
                          ? a.createdAt.toDate()
                          : a.createdAt
                      )
                  )
                  .map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {req?.userId ?? "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        $
                        {(Number(req?.amount) || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {req?.selectedWallet?.method ?? "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatFirestoreDate(req.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                            ${
                              req?.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : ""
                            }
                            ${
                              req?.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : ""
                            }
                            ${
                              req?.status === "declined"
                                ? "bg-red-50 text-red-700"
                                : ""
                            }
                          `}
                        >
                          {req?.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setConfirmApproveAction(true);
                          }}
                          disabled={req?.status !== "pending"}
                          className={`px-3 py-1 rounded text-xs font-medium transition
                            ${
                              req?.status === "pending"
                                ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setConfirmDeclineAction(true);
                          }}
                          disabled={req?.status !== "pending"}
                          className={`px-3 py-1 rounded text-xs font-medium transition
                            ${
                              req?.status === "pending"
                                ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {filteredRequests?.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No deposit requests found.</p>
          ) : (
            filteredRequests
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt) -
                  new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt)
              )
              .map((req) => (
                <div
                  key={req.id}
                  className="bg-white shadow rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">User ID</span>
                    <span className="text-sm font-medium">{req?.userId ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Amount</span>
                    <span className="text-sm font-medium">
                      ${(Number(req?.amount) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Wallet</span>
                    <span className="text-sm">{req?.selectedWallet?.method ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Date</span>
                    <span className="text-sm">{formatFirestoreDate(req.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${req?.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
                        ${req?.status === "completed" ? "bg-green-100 text-green-700" : ""}
                        ${req?.status === "declined" ? "bg-red-50 text-red-700" : ""}
                      `}
                    >
                      {req?.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedReq(req);
                        setConfirmApproveAction(true);
                      }}
                      disabled={req?.status !== "pending"}
                      className={`flex-1 px-3 py-2 rounded text-xs font-medium transition
                        ${
                          req?.status === "pending"
                            ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReq(req);
                        setConfirmDeclineAction(true);
                      }}
                      disabled={req?.status !== "pending"}
                      className={`flex-1 px-3 py-2 rounded text-xs font-medium transition
                        ${
                          req?.status === "pending"
                            ? "bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>

      </div>



      {/* Approve Modal */}
      {confirmApproveAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] lg:w-96">
            <h2 className="text-lg font-semibold text-gray-800">
              Are you sure you want to approve?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                onClick={() => setConfirmApproveAction(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                onClick={approveTransaction}
              >
                {approving ? "Please wait..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {confirmDeclineAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] lg:w-96">
            <h2 className="text-lg font-semibold text-gray-800">
              Are you sure you want to decline?
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                onClick={() => setConfirmDeclineAction(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={declineTransaction}
              >
                {declining ? "Please wait..." : "Confirm"}
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

export default DepositRequests;
