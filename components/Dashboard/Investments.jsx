'use client';

import React, { useState } from 'react';
import { FiSearch, FiX, FiInfo } from 'react-icons/fi';
import { FaRocket, FaCrown, FaMountain, FaGem, FaUserAltSlash } from 'react-icons/fa';
import DetailRow from '../Utils/DetailRow';
import { useFirebase } from '@/lib/firebaseContext';
import Notification from '../Notifications/notifications';

const iconMap = {
  'Starter Edge': <FaRocket className="text-blue-500 text-2xl" />,
  'Prime Access': <FaCrown className="text-yellow-500 text-2xl" />,
  'Elite Horizon': <FaMountain className="text-purple-500 text-2xl" />,
  'Legacy Ultra': <FaGem className="text-pink-500 text-2xl" />,
};

const ManageInvestments = () => {
  const [selectedInv, setSelectedInv] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const { allInvestments } = useFirebase();
  const [payoutReq, setPayoutReq] = useState(null);
  const [percentage, setPercentage] = useState('');

  // NOTIFICATION
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('N/a');

  const [processing, setProcessing] = useState(false);

  const filteredInvestments = allInvestments.filter((inv) => {
    const matchesSearch =
      inv?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      inv?.plan?.toLowerCase().includes(search.toLowerCase());
  
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && inv.hasActivePlan === true) ||
      (statusFilter === 'Inactive' && inv.hasActivePlan === false);
  
    return matchesSearch && matchesStatus;
  });

  const payOut = async (e) => {
    e.preventDefault();
    console.log("pay out req::", payoutReq);
    console.log("perc::", percentage);
    setProcessing(true);

    try {
      const response = await fetch('/api/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ percentage, payoutReq }),
      });
  
      if (!response.ok) {

        setNotificationMessage('Unable to process payout.');
        setNotificationType('error');
        setShowNotification(true);
        setProcessing(false);
    
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return;
        // throw new Error('Failed to remove user');
      }
  
      const data = await response.json();
  
      setNotificationMessage('Payout processed successfully!');
      setNotificationType('success');
      setShowNotification(true);
      setProcessing(false);
      setPayoutReq(null);
      setPercentage('');
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
  
      return data;
    } catch (error) {
      console.error('Error processing payout:', error);
      throw error;
    }
    
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Manage Investments</h1>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by name or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Responsive Cards */}
      <div className="grid gap-2 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredInvestments.length > 0 ? (
        filteredInvestments.map((inv) => (
          <div
            key={inv.id}
            className="bg-white border transition rounded p-5 space-y-3"
          >
            <div className="flex items-center gap-3 mb-4">
              {iconMap[inv.activePlan] || (
                <FaUserAltSlash className="text-gray-400 text-2xl" />
              )}
              <div>
                <h2 className="text-base font-semibold text-gray-800">{inv.fullName}</h2>
                <p className="text-sm text-gray-500">{inv.activePlan || 'N/A'}</p>
              </div>
            </div>
            <div className='w-full flex justify-between items-center'>
              <div>
                <p className="text-sm text-gray-600">Activated on</p>
                <p className="text-sm font-medium">
                  {inv.activatedOn?.toDate().toLocaleDateString() || 'N/A'}
                </p>
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    inv.hasActivePlan
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {inv.hasActivePlan ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex justify-between items-center gap-2">
              <button
                onClick={() => setSelectedInv(inv)}
                className="w-full text-sm px-3 py-1.5 rounded bg-transparent text-blue-800 border border-blue-800"
              >
                View Details
              </button>
              <button
                onClick={() => setPayoutReq(inv)}
                disabled={!inv.hasActivePlan}
                className={`w-full text-sm px-3 py-1.5 rounded text-white border border-blue-800 ${
                  inv.hasActivePlan
                    ? 'bg-blue-800 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Payout
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No investments match your search/filter.</p>
      )}
      </div>

      {/* Modal */}
      {selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4">
          <div className="bg-white w-full max-w-lg p-6 lg:p-10 shadow-xl relative rounded-xl">
            <button
              onClick={() => setSelectedInv(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                {iconMap[selectedInv?.activePlan] ?? (
                  <FaUserAltSlash className="text-gray-300 text-3xl" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedInv?.fullName}
                </h2>
                <p className="text-sm text-gray-500">{selectedInv?.plan}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <DetailRow label="Plan" value={selectedInv.activePlan || 'No plan assigned'} />
              <DetailRow
                label="Locked Balance"
                value={
                  selectedInv.lockedBal !== undefined
                    ? `$${Number(selectedInv.lockedBal).toLocaleString()}`
                    : 'N/A'
                }
              />
              <DetailRow label="Activation Date" value={
                selectedInv.activatedOn
                  ? selectedInv.activatedOn.toDate().toLocaleDateString()
                  : 'N/A'
              } />
              <DetailRow
                label="Status"
                valueClassName={`capitalize px-4 py-1 rounded-full text-sm font-medium ${
                  selectedInv.hasActivePlan
                    ? 'bg-green-100 text-green-700'
                    : !selectedInv.hasActivePlan
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
                value={selectedInv.hasActivePlan ? 'Active' : 'Inactive'}
              />
            </div>
          </div>
        </div>
      )}

    {payoutReq && (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-4">
        <div className="bg-white w-full max-w-md p-6 shadow-xl relative rounded-xl">
          <button
            onClick={() => {
              setPayoutReq(null);
              setPercentage('');
            }}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>

          <h2 className="text-lg font-semibold mb-4 text-gray-800">Payout for {payoutReq.fullName}</h2>

          <form
            className="space-y-4"
          >
            <div>
              <label htmlFor="percentage" className="block text-sm font-medium text-gray-700">
                Enter Payout Percentage
              </label>
              <input
                id="percentage"
                type="number"
                value={percentage}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (Number(val) >= 1 && Number(val) <= 100)) {
                    setPercentage(val);
                  }
                }}
                placeholder="e.g. 10"
                min="1"
                max="100"
                className="mt-1 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <button
              className="w-full flex justify-center items-center bg-blue-800 text-white text-sm py-2 rounded hover:bg-grblueeen-700"
              onClick={(e) => payOut(e)}
              disabled={processing}
            >
              {processing ? (
                <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
              ) : (
                <div className="text-white text-center h-6">Process Payout</div>
              )}
            </button>

            <div className="flex items-center space-x-1 text-gray-500 font-medium">
              <FiInfo size={14} />
              <small>Please note: this action cannot be undone.</small>
            </div>

          </form>
        </div>
      </div>
    )}

    {showNotification && (
        <Notification
          type={notificationType}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          show={true}
        />
      )}

    </div>
  );
};

export default ManageInvestments;
