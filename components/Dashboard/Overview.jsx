'use client';

import { useFirebase } from '@/lib/firebaseContext';
import React, { useState } from 'react';
import { FaUsers, FaDollarSign, FaChartLine, FaHourglassHalf, FaCheck } from 'react-icons/fa';
import { FiInfo } from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const Overview = () => {

  const { allUsers } = useFirebase();

  const stats = [
    {
      icon: <FaUsers className="text-blue-500 text-2xl lg:text-3xl" />,
      label: "Total Users",
      value: allUsers?.length,
      description: "The total number of users registered on the platform.",
    },
    {
      icon: <FaDollarSign className="text-green-500 text-2xl lg:text-3xl" />,
      label: "Total Investments",
      value: "$105,300.75",
      description: "The cumulative amount of all user investments made so far.",
    },
    {
      icon: <FaChartLine className="text-purple-500 text-2xl lg:text-3xl" />,
      label: "Revenue This Month",
      value: "$12,740.96",
      description: "The total platform revenue generated in the current month.",
    },
  ];

  const activity = [
    { status: 'success', message: 'John Doe deposited', value: '$500' },
    { status: 'success', message: 'New user', value: 'janedoe@gmail.com signed up' },
    { status: 'pending', message: 'Payout request from Mike for', value: '$1,000' },
    { status: 'success', message: 'Investment of', value: '$2,500 approved' },
  ];

  const statusColors = {
    Active: 'text-green-600',
    Pending: 'text-yellow-600',
    Inactive: 'text-red-600',
  };

  const investmentData = [
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 15000 },
    { month: 'Mar', value: 17000 },
    { month: 'Apr', value: 14000 },
    { month: 'May', value: 19000 },
    { month: 'Jun', value: 21000 },
  ];

  const [showInfo, setShowInfo] = useState(false);

  const toggleInfo = () => setShowInfo(!showInfo);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 space-y-4 lg:space-y-6 px-4 py-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="relative bg-white shadow rounded-md p-6 flex items-start space-x-4">
            {/* Info Icon */}
            <div className="absolute top-2 right-2">
              {/* Hover tooltip for desktop */}
              <div className="hidden md:block group relative">
                <FiInfo className="text-gray-400 cursor-pointer" />
                <div className="absolute top-6 right-0 z-10 hidden group-hover:block bg-black/90 text-white text-xs rounded-md px-2 py-1 w-max max-w-xs">
                  {stat.description}
                </div>
              </div>
      
              {/* Click-to-toggle info box for mobile */}
              <div className="block md:hidden">
                <FiInfo
                  className="text-gray-400 cursor-pointer"
                  onClick={toggleInfo}
                />
                {showInfo && (
                  <div className="absolute top-6 right-0 z-10 bg-black text-white text-xs rounded-md px-2 py-1 w-max max-w-xs">
                    {stat.description}
                  </div>
                )}
              </div>
            </div>
      
            {/* Card Content */}
            {stat.icon}
            <div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Overview */}
        <div className="bg-white shadow rounded-md p-6">
          <h2 className="text-lg font-bold mb-4">Investment Overview</h2>
          <div className="h-64 bg-white rounded-md">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={investmentData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4F46E5"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-md p-6">
          <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
          <ul className="space-y-4">
            {activity.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-3 text-sm text-gray-700">
                <div className="pt-1">
                  {item.status === 'success' ? (
                    <FaCheck className="text-green-600" />
                  ) : (
                    <FaHourglassHalf className="text-yellow-500" />
                  )}
                </div>
                <div>
                  <span>{item.message} </span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Latest Users Table */}
      <div className="bg-white shadow rounded-md p-6 overflow-auto">
        <h2 className="text-lg font-bold mb-4">Latest Registered Users</h2>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-sm text-left text-gray-700">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Date Joined</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
            {[...allUsers]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Descending by createdAt
              .slice(0, 5) // Take only the first 5
              .map((user, idx) => (
                <tr key={idx} className="border-t border-gray-200">
                  <td className="py-3 px-4">{user.fullName}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    {user.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className={`py-3 px-4 font-medium ${statusColors[user.status] || ''}`}>
                    {user.verified ? 'Verified' : 'Unverified'}
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
        {allUsers.map((user, idx) => (
          <div key={idx} className="border rounded-lg p-4 shadow-sm">
            <div className="mb-2">
              <span className="font-semibold">Name: </span>{user.name}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Email: </span>{user.email}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Date Joined: </span>
              {user.joined?.toDate().toLocaleDateString()}
            </div>
            <div className={`font-semibold ${statusColors[user.status] || ''}`}>
              Status: {user.verified ? 'Verified' : 'Unverified'}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default Overview;
