// pages/dashboard/users/index.js
'use client';
import { useEffect, useState } from 'react';
// Re-import 'query' and 'where' as we will use them again for filtering
import { collection, query, where, getDocs } from 'firebase/firestore';
import db from '../../../lib/firebase';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import Link from 'next/link';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      // Query to fetch only users where 'hasActiveInvestments' is true
      const q = query(
        collection(db, 'USERS'),
        where('hasActiveInvestments', '==', true) // Filter by the new boolean field
      );

      try {
        const snapshot = await getDocs(q);
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        // Updated console log message
        console.log("Fetched users with active investments:", usersList);
      } catch (error) {
        // Updated error logging message
        console.error("Error fetching users with active investments:", error);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array means this runs once on component mount

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Updated heading to reflect "users with active investments" */}
        <h1 className="text-xl font-semibold mb-4">Users with Active Investments</h1>
        {users.length === 0 ? (
          // Updated message for when no users with active investments are found
          <p>No users with active investments found.</p>
        ) : (
          <ul className="space-y-4">
            {users.map(user => (
              <li key={user.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  {/* Ensure 'user.fullName' or 'user.name' matches your Firestore field */}
                  <p className="font-medium">{user.fullName || user.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{user.email || 'No Email'}</p>
                </div>
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Manage
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}