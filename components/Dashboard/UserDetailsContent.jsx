// components/Dashboard/UserDetailsContent.jsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import db from '../../lib/firebase'; // CORRECT PATH AND IMPORT STYLE
import { AnimatePresence } from 'framer-motion';
import Notification from '../Notifications/notifications'; // Assuming this path is correct

export default function UserDetailsContent({ userId }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('active'); // User overall status
    const [walletBalance, setWalletBalance] = useState(0); // From USERS document
    const [earningStatus, setEarningStatus] = useState('running'); // From USERS document
    const [adminNote, setAdminNote] = useState(''); // From USERS document
    const [transactionHistory, setTransactionHistory] = useState([]); // From USERS document
    const [kycDocs, setKycDocs] = useState([]); // From USERS document
    // State for new fields from USERS (updated by cron job)
    const [currentPlanDaysCompleted, setCurrentPlanDaysCompleted] = useState(0);
    const [currentPlanRoiPercentage, setCurrentPlanRoiPercentage] = useState(0);
    const [lastRoiPaymentDate, setLastRoiPaymentDate] = useState('');
    const [hasActiveInvestments, setHasActiveInvestments] = useState(false);

    // State for fields from INVESTMENT document (activePlan details and payoutLogs)
    const [investmentPlanAmount, setInvestmentPlanAmount] = useState(0);
    const [investmentPlanRoiPercent, setInvestmentPlanRoiPercent] = useState(0);
    const [investmentPlanName, setInvestmentPlanName] = useState('');
    const [payoutLogs, setPayoutLogs] = useState([]);

    const [actionType, setActionType] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    useEffect(() => {
        if (!userId) return;

        const fetchUserAndInvestmentData = async () => {
            setLoading(true);
            try {
                // Fetch from USERS collection
                const userRef = doc(db, 'USERS', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    console.log("Fetched USERS data:", data); // Debugging
                    setName(data.fullName ?? '');
                    setEmail(data.email ?? '');
                    setPhone(data.phone ?? '');
                    setPhotoURL(data.photoURL ?? '');
                    setWalletBalance(data.walletBalance ?? 0);
                    setStatus(data.status ?? 'active');
                    setEarningStatus(data.earningStatus ?? 'running');
                    setAdminNote(data.adminNote ?? '');
                    setTransactionHistory(data.transactionHistory ?? []);
                    setKycDocs(data.kycDocs ?? []);
                    
                    // CRITICAL: Fetch these updated fields from USERS document
                    setCurrentPlanDaysCompleted(data.currentPlanDaysCompleted ?? 0);
                    setCurrentPlanRoiPercentage(data.currentPlanRoiPercentage ?? 0);
                    setLastRoiPaymentDate(data.lastRoiPaymentDate ?? 'N/A');
                    setHasActiveInvestments(data.hasActiveInvestments ?? false);
                } else {
                    console.warn("No USERS document found for UID:", userId);
                    setNotificationType('error');
                    setNotificationMessage('User details not found.');
                    setShowNotification(true);
                }

                // Fetch from INVESTMENT collection
                const investmentRef = doc(db, 'INVESTMENT', userId);
                const investmentSnap = await getDoc(investmentRef);

                if (investmentSnap.exists()) {
                    const investment = investmentSnap.data();
                    console.log("Fetched INVESTMENT data:", investment); // Debugging
                    setInvestmentPlanAmount(investment?.activePlan?.amount ?? 0);
                    setInvestmentPlanRoiPercent(investment?.activePlan?.roiPercent ?? 0);
                    setInvestmentPlanName(investment?.activePlan?.planName ?? '');
                    setPayoutLogs(investment?.payoutLogs ?? []);
                } else {
                    console.log("No INVESTMENT document found for UID:", userId);
                    // This is not necessarily an error, just no active plan/investment yet
                    setInvestmentPlanAmount(0);
                    setInvestmentPlanRoiPercent(0);
                    setInvestmentPlanName('');
                    setPayoutLogs([]);
                }

            } catch (error) {
                console.error("Error fetching user or investment data:", error);
                setNotificationType('error');
                setNotificationMessage('Failed to load user or investment details.');
                setShowNotification(true);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndInvestmentData();
    }, [userId]); // Dependency array: re-run if userId changes

    // These functions handle admin actions and update Firestore
    const handleAction = async (type) => {
        // Validate amount input
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            setNotificationType('error');
            setNotificationMessage('Please enter a valid amount greater than zero.');
            setShowNotification(true);
            return;
        }

        const value = parseFloat(amount);
        // Prevent debiting more than current wallet balance
        if (type === 'debit' && value > (walletBalance ?? 0)) { // Add nullish coalescing here too
            setNotificationType('error');
            setNotificationMessage('Cannot debit more than wallet balance.');
            setShowNotification(true);
            return;
        }

        setLoading(true); // Start loading state for the action
        const userRef = doc(db, 'USERS', userId); // Reference to the user's document
        const date = new Date();
        const formattedDate = date.toLocaleString('en-US', { // Format date for display
            timeZone: 'Africa/Lagos', // Using Lagos timezone as per your current location
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Calculate new balance
        const currentWalletBalance = walletBalance ?? 0; // Ensure currentWalletBalance is a number
        const newBalance = type === 'credit' ? currentWalletBalance + value : currentWalletBalance - value;

        try {
            // Update wallet balance and add to transaction history in Firestore
            await updateDoc(userRef, {
                walletBalance: newBalance,
                transactionHistory: arrayUnion({ // Use arrayUnion to safely add to the array
                    type: type === 'credit' ? 'Credit' : 'Debit',
                    amount: value,
                    date: date.toISOString(), // Store ISO string for precise date
                    formattedDate // Store formatted string for display
                })
            });

            // Update local state to reflect changes immediately
            setWalletBalance(newBalance);
            setTransactionHistory(prev => [...prev, {
                type: type === 'credit' ? 'Credit' : 'Debit',
                amount: value,
                date: date.toISOString(),
                formattedDate
            }]);
            setAmount(''); // Clear amount input
            setActionType(null); // Reset action type
            setNotificationType('success');
            setNotificationMessage(`${type === 'credit' ? 'Credited' : 'Debited'} successfully!`);
            setShowNotification(true);
        } catch (err) {
            console.error(err);
            setNotificationType('error');
            setNotificationMessage(`Failed to ${type} user.`);
            setShowNotification(true);
        } finally {
            setLoading(false); // End loading state
        }
    };

    const toggleUserStatus = async (newStatus) => {
        setLoading(true);
        const userRef = doc(db, 'USERS', userId);
        try {
            await updateDoc(userRef, { status: newStatus });
            setStatus(newStatus); // Update local state
            setNotificationType('success');
            setNotificationMessage(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`);
            setShowNotification(true);
        } catch (error) {
            console.error(error);
            setNotificationType('error');
            setNotificationMessage('Failed to update user status.');
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminNoteSave = async () => {
        setLoading(true);
        const userRef = doc(db, 'USERS', userId);
        try {
            await updateDoc(userRef, { adminNote });
            setNotificationType('success');
            setNotificationMessage('Admin note saved successfully!');
            setShowNotification(true);
        } catch (error) {
            console.error(error);
            setNotificationType('error');
            setNotificationMessage('Failed to save admin note.');
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    };

    const handleEarningStatusChange = async (newStatus) => {
        setLoading(true);
        const userRef = doc(db, 'USERS', userId);
        try {
            await updateDoc(userRef, { earningStatus: newStatus });
            setEarningStatus(newStatus); // Update local state
            setNotificationType('success');
            setNotificationMessage(`Earnings ${newStatus === 'running' ? 'resumed' : newStatus === 'paused' ? 'paused' : 'stopped'} successfully!`);
            setShowNotification(true);
        } catch (error) {
            console.error(error);
            setNotificationType('error');
            setNotificationMessage('Failed to update earnings status.');
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    };

    // Calculations based on the fetched data
    // Ensure these calculations also use nullish coalescing for safety
    const totalRoiEarned = payoutLogs.reduce((sum, log) => sum + (log.amount ?? 0), 0);
    const avgRoiPerDay = currentPlanDaysCompleted > 0 ? (totalRoiEarned / currentPlanDaysCompleted) : 0;
    const progressPercent = (currentPlanDaysCompleted / 7) * 100; // Assuming 7 days is max for display
    const nextPayment = currentPlanDaysCompleted < 7 ? `In ${1} day(s)` : 'N/A'; // This logic might need refinement based on exact payment schedule

    if (loading) {
        return <p>Loading user details...</p>; // Or your Loader component
    }

    return (
        <div className="p-4 space-y-6">
            <AnimatePresence>
                {showNotification && (
                    <Notification
                        type={notificationType}
                        message={notificationMessage}
                        onClose={() => setShowNotification(false)}
                        show={true}
                    />
                )}
            </AnimatePresence>

            <h2 className="text-xl font-bold">User Investment Summary for {name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* User Details (from USERS doc) */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Email</h3>
                    <p className="text-lg font-semibold">{email}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Wallet Balance</h3>
                    <p className="text-lg font-semibold">${(walletBalance ?? 0).toFixed(2)}</p> {/* Added ?? 0 */}
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Overall Status</h3>
                    <p className="text-lg font-semibold capitalize">{status}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Earning Status</h3>
                    <p className="text-lg font-semibold capitalize">{earningStatus}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Last ROI Payment</h3>
                    <p className="text-lg font-semibold">{lastRoiPaymentDate}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Active Investments</h3>
                    <p className="text-lg font-semibold">{hasActiveInvestments ? 'Yes' : 'No'}</p>
                </div>
                {/* Admin Note Input */}
                <div className="bg-white rounded-xl shadow p-4 md:col-span-3">
                    <h3 className="text-sm text-gray-600 mb-1">Admin Note</h3>
                    <textarea
                        className="w-full border p-2 rounded"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows="3"
                    ></textarea>
                    <button onClick={handleAdminNoteSave} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Save Note
                    </button>
                </div>

                {/* Investment Details (from USERS and INVESTMENT docs) */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Plan Name (from Investment)</h3>
                    <p className="text-lg font-semibold">{investmentPlanName || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Plan Amount (from Investment)</h3>
                    <p className="text-lg font-semibold">${(investmentPlanAmount ?? 0).toFixed(2)}</p> {/* Added ?? 0 */}
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">ROI Percent (from USERS)</h3>
                    <p className="text-lg font-semibold">{(currentPlanRoiPercentage ?? 0) * 100}%</p> {/* Added ?? 0 */}
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Days Completed (from USERS)</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold">{(currentPlanDaysCompleted ?? 0)} / 7</p> {/* Added ?? 0 */}
                        <div className="w-1/2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Total ROI Earned</h3>
                    <p className="text-lg font-semibold text-green-600">${(totalRoiEarned ?? 0).toFixed(2)}</p> {/* Added ?? 0 */}
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Average ROI / Day</h3>
                    <p className="text-lg font-semibold">${(avgRoiPerDay ?? 0).toFixed(2)}</p> {/* Added ?? 0 */}
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Next ROI Payment</h3>
                    <p className="text-lg font-semibold text-purple-600">{nextPayment}</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">Investment Status</h3>
                    <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${(currentPlanDaysCompleted ?? 0) >= 7 ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                        {(currentPlanDaysCompleted ?? 0) >= 7 ? 'Completed' : 'Active'}
                    </span>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-sm text-gray-600 mb-1">ROI Completion</h3>
                    <p className="text-lg font-semibold">{Math.round(progressPercent ?? 0)}%</p> {/* Added ?? 0 */}
                </div>
                <div className="bg-white rounded-xl shadow p-4 col-span-full">
                    <h3 className="text-sm text-gray-600 mb-3">Payout Logs</h3>
                    <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {/* CRITICAL FIX: Ensure log.amount is not undefined */}
                        {payoutLogs.length === 0 ? (
                            <li className="text-gray-500 text-sm">No ROI payouts yet.</li>
                        ) : (
                            payoutLogs.map((log, i) => (
                                <li key={i} className="py-2 text-sm flex justify-between">
                                    <span>{log.date}</span>
                                    <span className="text-green-600 font-medium">+${(log.amount ?? 0).toFixed(2)}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Transaction History Section */}
            <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-sm text-gray-600 mb-3">Transaction History</h3>
                <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                    {/* CRITICAL FIX: Ensure tx.amount is not undefined */}
                    {transactionHistory.length === 0 ? (
                        <li className="text-gray-500 text-sm">No transactions yet.</li>
                    ) : (
                        transactionHistory.map((tx, i) => (
                            <li key={i} className="py-2 text-sm flex justify-between items-center">
                                <span>{tx.type} - {tx.date}</span>
                                <span className={(tx.amount ?? 0) > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    ${(tx.amount ?? 0).toFixed(2)}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* KYC Documents Section */}
            <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-sm text-gray-600 mb-3">KYC Documents</h3>
                <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                    {kycDocs.length === 0 ? (
                        <li className="text-gray-500 text-sm">No KYC documents uploaded.</li>
                    ) : (
                        kycDocs.map((docItem, i) => ( // Changed 'doc' to 'docItem' to avoid conflict with imported 'doc' function
                            <li key={i} className="py-2 text-sm flex justify-between items-center">
                                <span>{docItem.fileName || `Document ${i + 1}`} ({docItem.type})</span>
                                {docItem.url && (
                                    <a href={docItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        View
                                    </a>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}