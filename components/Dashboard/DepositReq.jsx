import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import  db  from "../../lib/firebase";
// import Sidebar from "../Sidebar";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
// import Notification from '../Notifications/notification';

const DepositRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [confirmApproveAction, setConfirmApproveAction] = useState(false);
  const [confirmDeclineAction, setConfirmDeclineAction] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "depositRequests"));
        const data = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setRequests(data);
        setFilteredRequests(data);
      } catch (error) {
        console.error("Error fetching deposit requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    if (!value) {
      setFilteredRequests(requests);
      return;
    }
    const lowerValue = value.toLowerCase();
    setFilteredRequests(
      requests.filter(
        (req) =>
          req?.userId?.toLowerCase().includes(lowerValue) ||
          req?.status?.toLowerCase().includes(lowerValue) ||
          req?.selectedWallet?.method?.toLowerCase().includes(lowerValue)
      )
    );
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    try {
      await updateDoc(doc(db, "depositRequests", selectedReq.id), {
        status: "completed",
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id ? { ...r, status: "completed" } : r
        )
      );
      toast.success("Deposit request approved!");
    } catch (error) {
      console.error("Error approving deposit request:", error);
      toast.error("Error approving deposit request");
    } finally {
      setConfirmApproveAction(false);
      setSelectedReq(null);
    }
  };

  const handleDecline = async () => {
    if (!selectedReq) return;
    try {
      await updateDoc(doc(db, "depositRequests", selectedReq.id), {
        status: "declined",
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id ? { ...r, status: "declined" } : r
        )
      );
      toast.success("Deposit request declined!");
    } catch (error) {
      console.error("Error declining deposit request:", error);
      toast.error("Error declining deposit request");
    } finally {
      setConfirmDeclineAction(false);
      setSelectedReq(null);
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
      </div>
    </div>
  );
};

export default DepositRequests;
