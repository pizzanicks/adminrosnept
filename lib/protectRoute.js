import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export default function protectRoute(Component) {
  return function AuthenticatedComponent(props) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.push('/auth/login'); // Redirect unauthenticated users
        } else {
          setLoading(false); // Stop loading after user is authenticated
        }
      });

      return () => {
        unsubscribe();
      };
    }, [router]);

    if (loading) {
      return null; // Show nothing while checking authentication
    }

    return <Component {...props} />;
  };
}