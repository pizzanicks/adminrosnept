// pages/dashboard/users/[id].js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import db from '../../../lib/firebase';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import UserDetailsContent from '../../../components/Dashboard/UserDetailsContent';

export default function UserDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [userExists, setUserExists] = useState(null);

  useEffect(() => {
    const checkUserExists = async () => {
      if (!id) {
        // If ID is not yet available from router, don't try to fetch
        setIsLoading(true); // Keep loading state until ID is present
        return;
      }

      try {
        // *** CHANGE 'users' to 'USERS' here to match your Firestore collection ***
        const userRef = doc(db, 'USERS', id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserExists(true);
          console.log("User document found for ID:", id); // Added log
        } else {
          setUserExists(false);
          console.warn("User document NOT found for ID:", id); // Added log
        }
      } catch (err) {
        console.error('Error checking user existence:', err);
        setUserExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserExists();
  }, [id]); // Dependency array to re-run when 'id' changes

  return (
    <DashboardLayout>
      <div className="p-6 min-h-[300px]">
        {isLoading && <p>Loading user details...</p>}

        {!isLoading && userExists && (
          <UserDetailsContent userId={id} />
        )}

        {!isLoading && userExists === false && (
          <div className="text-red-600 font-semibold">
            ❌ User not found. Please check the URL or return to the users list.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}