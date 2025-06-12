import React, { useState } from "react";
import { FiEye, FiCheckCircle, FiXCircle, FiHelpCircle, FiSearch } from "react-icons/fi";
import Image from "next/image";
import DetailRow from "../Utils/DetailRow";
import { useFirebase } from "@/lib/firebaseContext";
import Notification from "../Notifications/notifications";

const KycDashboard = () => {
  const [viewUser, setViewUser] = useState(null);
  const [approveUser, setApproveUser] = useState(null);
  const [declineUser, setDeclineUser] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { kycRequests } = useFirebase();

  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);

  // NOTIFICATION
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');

  // Filter users by search and status
  const filteredUsers = kycRequests.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || user.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const approveKyc = async (user) => {
    // console.log("data::", user);
    setApproving(true);

    try {
      const response = await fetch('/api/approveKyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });
  
      if (!response.ok) {

        setNotificationMessage('Unable to approve customer KYC.');
        setNotificationType('error');
        setShowNotification(true);
        setApproving(false);
    
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return;
        // throw new Error('Failed to remove user');
      }
  
      const data = await response.json();
  
      setNotificationMessage('Customer KYC approved successfully!');
      setNotificationType('success');
      setShowNotification(true);
      setApproving(false);
      setApproveUser(null);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error approving customer KYC:', error);
      throw error;
    }
    
  }

  const declineKyc = async (user) => {
    setDeclining(true);
    try {
      const response = await fetch('/api/declineKyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });
  
      if (!response.ok) {

        setNotificationMessage('Unable to decline customer KYC.');
        setNotificationType('error');
        setShowNotification(true);
        setDeclining(false);
    
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return;
        // throw new Error('Failed to remove user');
      }
  
      const data = await response.json();
  
      setNotificationMessage('Customer KYC declined successfully!');
      setNotificationType('success');
      setShowNotification(true);
      setDeclining(false);
      setDeclineUser(null);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error declining customer KYC:', error);
      throw error;
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-lg lg:text-2xl font-bold text-blue-900 mb-6">KYC Requests</h2>

    {/* Search and Filter */}
    <div className="flex justify-between gap-4 mb-6">
        <div className="relative w-3/5 lg:w-full">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-2/5"
        >
          <option value="All">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {/* User Grid */}
      <div className="grid gap-2 lg:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="border rounded p-4 shadow-sm bg-white flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base lg:text-lg font-semibold capitalize">{user.fullName}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm mt-1">
                  status:{" "}
                  <span
                    className={`font-medium ${
                      user.status === "pending"
                        ? "text-yellow-600"
                        : user.status === "approved"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </p>
              </div>

              <div className="w-full mt-4 flex justify-between items-center space-x-4 text-sm text-blue-600 bg-gray-50 rounded px-3 py-2">
                <button
                  onClick={() => setViewUser(user)}
                  className="flex items-center space-x-1 hover:underline"
                >
                  <FiEye />
                  <span>View</span>
                </button>

                <button
                  onClick={() => setApproveUser(user)}
                  className="flex items-center space-x-1 hover:underline text-green-600"
                >
                  <FiCheckCircle />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => setDeclineUser(user)}
                  className="flex items-center space-x-1 hover:underline text-red-600"
                >
                  <FiXCircle />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">No users found.</p>
        )}
      </div>

      {/* View Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-base lg:text-lg text-blue-800 font-semibold mb-4 border-b pb-4">View KYC Request</h3>

            <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 bg-blue-100 w-[fit-content] rounded-full px-6 mb-3">
                User Info
              </h4>
              <DetailRow label="Name:" value={viewUser.fullName} />
              <DetailRow label="Email:" value={viewUser.email} />
              <DetailRow label="Phone:" value={viewUser.phone || "N/A"} />
              <DetailRow label="Address:" value={viewUser.address || "N/A"} />
              <DetailRow label="Country:" value={viewUser.country || "N/A"} />
              <DetailRow label="Telegram:" value={viewUser.telegram || "N/A"} />
            </div>

              <div className="flex-1">
                <h4 className="font-medium text-blue-800 bg-blue-100 w-[fit-content] rounded-full px-6 mb-3">Documents</h4>
                <div className="space-y-3">
                {viewUser.frontFileUrl || viewUser.backFileUrl ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {viewUser.frontFileUrl && (
                      <div className="border rounded p-2">
                        <p className="text-sm font-medium mb-1">Front of Document</p>
                        <Image
                          src={viewUser.frontFileUrl}
                          alt="Front Document"
                          height={800}
                          width={800}
                          className="w-full h-48 object-contain rounded"
                        />
                      </div>
                    )}
                    {viewUser.backFileUrl && (
                      <div className="border rounded p-2">
                        <p className="text-sm font-medium mb-1">Back of Document</p>
                        <Image
                          src={viewUser.backFileUrl}
                          alt="Back Document"
                          height={800}
                          width={800}
                          className="w-full h-48 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No documents uploaded</p>
                )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewUser(null)}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <FiHelpCircle className="text-yellow-500 text-5xl" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Approve KYC Request</h3>
            <p className="mb-6">
              Are you sure you want to approve <strong>{approveUser.fullName}</strong>'s KYC request?
            </p>
            <div className="w-full flex justify-center space-x-2">
              <button
                onClick={() => setApproveUser(null)}
                className="w-[50%] px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // console.log("Approved:", approveUser.id);
                  // setApproveUser(null);
                  approveKyc(approveUser)
                }}
                disabled={approving}
                className="w-[50%] flex justify-center items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                {approving ? (
                  <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                ) : (
                  <div className="text-white text-center h-6 flex justify-center items-center space-x-1">
                    <FiCheckCircle />
                    <span>Approve</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {declineUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <FiHelpCircle className="text-yellow-500 text-5xl" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Decline KYC Request</h3>
            <p className="mb-6">
              Are you sure you want to decline <strong>{declineUser.fullName}</strong>'s KYC request?
            </p>
            <div className="w-full flex justify-center space-x-2">
              <button
                onClick={() => setDeclineUser(null)}
                className="w-[50%] px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // console.log("Declined:", declineUser.id);
                  // setDeclineUser(null);
                  declineKyc(declineUser)
                }}
                disabled={declining}
                className="w-[50%] flex justify-center items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded space-x-1"
              >
                {declining ? (
                  <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                ) : (
                  <div className="text-white text-center h-6 flex justify-center items-center space-x-1">
                    <FiXCircle />
                    <span>Decline</span>
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

export default KycDashboard;
