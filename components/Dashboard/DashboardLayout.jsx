'use client'

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { FiMenu, FiUser, FiUsers, FiChevronDown, FiLogOut, FiSettings, FiX, FiBell } from 'react-icons/fi';
import { FaTachometerAlt, FaMoneyCheckAlt, FaHandHoldingUsd, FaUserFriends, FaHeadset, FaCog, FaIdCard, FaDollarSign, FaArrowCircleDown, FaArrowCircleUp } from 'react-icons/fa';
// import { MdOutlineAttachMoney } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { getAuth, signOut } from "firebase/auth";
// Removed duplicate FaUsers import, it was already there.
import { useRouter } from 'next/router';

const menuItems = [
  { icon: <FaTachometerAlt />, label: 'Admin Overview', path: '/dashboard' },
  { icon: <FaUserFriends />, label: 'Manage Users', path: '/dashboard/users' }, // This links to the users list page (index.js)
  { icon: <FiUser />, label: 'Users', path: '/dashboard/profile' }, // This links to the Admin's own profile page
  { icon: <FaArrowCircleDown />, label: 'Deposit Requests', path: '/dashboard/depositrequest' },
  { icon: <FaArrowCircleUp />, label: 'Withdrawal Requests', path: '/dashboard/withdrawalrequest' },
  { icon: <FaMoneyCheckAlt />, label: 'Transactions', path: '/dashboard/transactions' },
  { icon: <FaHandHoldingUsd />, label: 'Investments', path: '/dashboard/investments' },
  { icon: <FaHandHoldingUsd />, label: 'Investment Plans', path: '/dashboard/plans'},
  { icon: <FaIdCard />, label: 'KYC Requests', path: '/dashboard/kycrequests' },
  { icon: <FaCog />, label: 'Account Settings', path: '/dashboard/settings' },
  { icon: <FaHeadset />, label: 'Support Tickets', path: '/dashboard/support' },
]

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize(); // initial check
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();

    try {
      await signOut(auth);
      console.log("User logged out successfully");
      router.push('/');
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || isDesktop) && (
          <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            className="fixed lg:static z-50 w-[80%] lg:w-[20%] h-screen bg-blue-950 text-gray-300 flex flex-col px-4 pb-4 lg:pb-6 pt-6 lg:pt-8"
          >
            {/* Close button for mobile */}
            <div className="z-40 absolute top-4 right-4 lg:hidden">
              <button onClick={() => setSidebarOpen(false)}>
                <span className="text-white text-3xl">
                  <FiX className="w-6 h-6" />
                </span>
              </button>
            </div>

            {/* Logo */}
            <div className="sticky top-0 bg-blue-950 z-10 mb-2">
              <Image
                src={"/logo-2.png"}
                height={400}
                width={400}
                className="h-10 lg:h-12 w-auto lg:w-48"
                alt="Logo"
              />
            </div>

            <div className="flex items-center space-x-3 border-t border-b border-[#22357b] py-4 my-4">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src="/avatar.png"
                  alt="Admin"
                  height={800}
                  width={800}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="text-base font-medium">Administrator</div>
                <div className="text-sm text-blue-300">
                  admin@deltaneutral.com
                </div>
              </div>
            </div>

            <div className="overflow-y-auto space-y-6 scrollbar-hide">
              <nav className="mt-4 space-y-2 flex-1">
                {menuItems.map((item, i) => {
                  const isActive = pathname === item.path;

                  return (
                    // Link usage is reverted to your original style
                    <Link
                      key={i}
                      href={item.path}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer text-sm
                        ${
                          isActive
                            ? "bg-[#1f306d] text-gray-100 font-medium"
                            : "hover:bg-blue-900"
                        }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="w-auto lg:w-[80%] flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between bg-white px-4 lg:px-12 py-3 lg:py-4 shadow fixed w-[100%] lg:w-[80%] z-30">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu className="text-2xl" />
          </button>

          <div className="ml-auto flex justify-end">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link
                href={"/dashboard/support"}
                className="w-8 lg:w-10 h-8 lg:h-10 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center"
              >
                <FiBell className="w-4 h-4 lg:w-5 lg:h-5" />
              </Link>
              <div className="text-sm hidden lg:block">
                <div className="font-semibold flex items-center space-x-2">
                  <span>Administrator</span>
                  <FiChevronDown
                    className="text-xs cursor-pointer"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  />
                </div>
              </div>
              <FiChevronDown
                className="lg:hidden text-xs cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-14 lg:top-14 right-4 w-64 bg-white rounded-b-lg shadow-lg p-4 z-40"
            >
              <div className="flex items-center space-x-3 border-b pb-4 mb-4">
                <div className="w-10 h-10 bg-blue-800 text-white rounded-full flex items-center justify-center font-bold">
                  <FiUser />
                </div>
                <div>
                  <div className="font-semibold">Administrator</div>
                  <div className="text-sm text-gray-500">
                    admin@deltaneutral.org
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  {/* This link remains to manage all users */}
                  <Link
                    href="/dashboard/users"
                    className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded cursor-pointer"
                  >
                    <FiUsers />
                    <span>Manage Users</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/transactions"
                    className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded cursor-pointer"
                  >
                    <FaDollarSign />
                    <span>Transactions</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded cursor-pointer"
                  >
                    <FiSettings />
                    <span>Platform Settings</span>
                  </Link>
                </li>
                <li>
                  {/* This path was corrected to match the sidebar's kycrequests previously */}
                  <Link
                    href="/dashboard/kycrequests"
                    className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded cursor-pointer"
                  >
                    <FaIdCard />
                    <span>KYC Requests</span>
                  </Link>
                </li>

                <li
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-600 hover:bg-red-50 p-2 rounded cursor-pointer"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="mt-12 lg:mt-16 p-0 overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
