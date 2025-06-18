// pages/dashboard/users/index.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../../../lib/firebase'; // This path is now correct for the assumed structure
import Link from 'next/link'; // Import Link for client-side navigation
import DashboardLayout from '@/components/Dashboard/DashboardLayout'; // Assuming this path is correct
import { AnimatePresence } from 'framer-motion';
// import Notification from '@/components/Notification'; // Import the Notification component
import Notification from '@/components/Notifications/notifications';

/**
 * UsersListPage displays a list of all users fetched from Firestore.
 * Each user in the list is a link to their individual details page.
 */
export default function UsersListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // State for general error messages

    // States for general notifications (e.g., if fetching users fails)
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Effect to fetch all users when the component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true); // Start loading
            setError(null); // Clear previous errors
            try {
                const usersCollection = collection(db, 'users'); // Reference to the 'users' collection
                const userSnapshot = await getDocs(usersCollection); // Fetch all documents
                // Map documents to an array of user objects, including their Firestore doc.id
                const usersList = userSnapshot.docs.map(doc => ({
                    id: doc.id, // The document ID is crucial for linking to details
                    ...doc.data() // All other fields of the user
                }));
                setUsers(usersList);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Failed to load users list.");
                setNotificationType('error');
                setNotificationMessage('Failed to load users list. Please try again.');
                setShowNotification(true);
            } finally {
                setLoading(false); // End loading
            }
        };
        fetchUsers();
    }, []); // Empty dependency array means this effect runs once after initial render

    return (
        <DashboardLayout>
            {/* Loading Spinner */}
            <AnimatePresence>
                {loading && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 rounded-2xl">
                        <div className="w-8 lg:w-12 h-8 lg:h-12 rounded-full animate-spin border-4 border-t-transparent border-l-transparent border-r-blue-500 border-b-purple-500 shadow-lg"></div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notification Component */}
            {showNotification && (
                <Notification
                    type={notificationType}
                    message={notificationMessage}
                    onClose={() => setShowNotification(false)}
                    show={showNotification}
                />
            )}

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <h1 className="text-2xl font-bold mb-6">All Users</h1>

                {/* Display general error message if fetching users failed */}
                {error && <p className="text-red-500 mb-4">{error}</p>}

                {/* Users List Section */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <ul className="divide-y divide-gray-200">
                        {/* Conditional rendering for no users found */}
                        {users.length === 0 && !loading ? (
                            <li className="py-4 text-gray-500">No users found.</li>
                        ) : (
                            // Map through the users array to display each user
                            users.map(user => (
                                <li key={user.id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-lg">{user.name || 'No Name'}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    {/* Use Next.js Link component for navigation */}
                                    <Link href={`/users/${user.id}`} legacyBehavior>
                                        <a className="text-blue-600 hover:underline text-sm font-medium">
                                            View Details
                                        </a>
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
