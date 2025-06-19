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
      const snapshot = await getDocs(collection(db, 'users'));
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    };

    fetchAllUsers();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">All Users</h1>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <ul className="space-y-4">
            {users.map(user => (
              <li key={user.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className={`text-xs ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {user.status}
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
