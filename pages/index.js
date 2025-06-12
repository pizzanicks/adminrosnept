import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Notification from '@/components/Notifications/notifications';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Email:', email);
    console.log('Password:', password);

    if ( email !== "admin@rosnept.com") {
      setLoading(false);
      setNotificationMessage('This platform is strictly for admin only!');
      setNotificationType("warning");
      setShowNotification(true);
    
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return;
    }
    
    setLoading(true);
    

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Logged in user:', user);
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error logging in:', error.code, error.message);
    
      let message = 'Login failed. Please try again.';
    
      switch (error.code) {
        case 'auth/invalid-credential':
          message = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          message = 'This user account has been disabled.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many login attempts. Please try again later.';
          break;
        default:
          message = `Login failed: ${error.message}`;
      }
    
      setLoading(false);
      setNotificationMessage(message);
      setNotificationType("error");
      setShowNotification(true);
    
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
    
  };

  return (
    <>
      <div className="relative w-full min-h-screen bg-cover bg-center" style={{ backgroundImage: `url('/login-bg.jpg')` }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm lg:backdrop-blur-0"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-5xl rounded-md grid grid-cols-1 lg:grid-cols-5 bg-white lg:bg-transparent bg-opacity-90 backdrop-blur-md overflow-hidden shadow-2xl">

            {/* Left Side */}
            <div className="hidden lg:block lg:col-span-3 bg-blue-950 text-white p-10">
              <h2 className="text-3xl font-bold mb-4 font-garamond">Welcome Back Admin</h2>
              <p className="text-sm mb-6 text-gray-300 font-barlow">
                Access your dashboard to manage users, review investments, update content, and keep the platform running smoothly and securely.
              </p>

              <div className="mt-auto pt-10 text-sm font-barlow">
                <p className="text-gray-400">Need help?</p>
                <Link href="mailto:support@rosnep.com" className="text-blue-300 hover:text-white">
                  support@rosnep.com
                </Link>
              </div>
            </div>

            {/* Right Side */}
            <div className="col-span-2 p-8 sm:p-10 relative font-barlow bg-white/70 backdrop-blur-md lg:bg-white lg:backdrop-blur-0">

              <div className="relative z-10">
                <div className="mb-6 text-center">
                  <Link href={'/'}>
                    <Image src={'/logo-1.png'} height={500} width={500} alt='logo image' className="w-32 lg:w-44 h-8 lg:h-10 mb-4 mx-auto" />
                  </Link>
                  <h3 className="text-base md:text-xl font-semibold text-gray-800">Login To Your Admin Dashboard</h3>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="••••••••"
                      required
                    />
                    <div className="text-right mt-2">
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="text-sm lg:text-base w-full flex justify-center items-center bg-blue-600 text-white font-medium py-2 hover:bg-blue-700 transition"
                  >
                      {loading ? (
                        <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
                      ) : (
                        <div className="text-white text-center h-6">Log In</div>
                      )}
                  </button>
                </form>

                <p className="text-sm text-center text-gray-600 mt-4">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/signup" className="text-blue-600 font-medium hover:underline">
                    Sign up
                  </Link>
                </p>

                <p className="text-xs text-center text-gray-500 mt-6">
                  &copy; {new Date().getFullYear()} Rosenp. All rights reserved.
                </p>
              </div>
            </div>

          </div>
        </div>

        {showNotification && (
          <Notification
            type={notificationType}
            message={notificationMessage}
            onClose={() => setShowNotification(false)}
            show={true}
          />
        )}

      </div>
    </>
  );
}
