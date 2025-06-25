// pages/dashboard/allusers/index.js
'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import db from '../../../lib/firebase';
import Link from 'next/link';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';

export default function AllUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'USERS')); // Corrected to 'USERS'
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
        console.log("Fetched all users for All Users page:", usersList);
      } catch (error) {
        console.error("Error fetching all users for All Users page:", error);
      }
    };

    fetchAllUsers();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">All Users</h1>
        {users.length === 0 ? (
          <p>No users found in the database.</p>
        ) : (
          <ul className="space-y-4">
            {users.map(user => (
              <li key={user.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.fullName || user.name || 'N/A Name'}</p> {/* Added 'N/A Name' fallback */}
                  <p className="text-sm text-gray-500">{user.email || 'No Email'}</p>
                  {/* Corrected logic for status display to prevent errors if user.status is undefined */}
                  <p className={`text-xs ${user.status && user.status.toLowerCase() === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {user.status || 'No Status'} {/* Changed 'N/A Status' to 'No Status' */}
                  </p>
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