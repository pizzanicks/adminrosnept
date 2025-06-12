import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiArrowDownLeft, FiArrowUpRight, FiCreditCard, FiChevronRight, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useFirebase } from '@/lib/firebaseContext';
import DetailRow from '../Utils/DetailRow';

const formatDate = (dateValue) => {
  const dateObj = new Date(dateValue);
  return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const ITEMS_PER_PAGE = 10;

const TransactionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filterRef = useRef(null);
  const { allHistory } = useFirebase();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTransactions = allHistory.filter((txn) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      txn.amount.toString().includes(query) ||
      txn.createdAt.toLowerCase().includes(query) ||
      txn.status.toLowerCase().includes(query);

    const matchesFilter = filterStatus ? txn.status === filterStatus.toLowerCase() : true;
    return matchesSearch && matchesFilter;
  });

  // Pagination slicing
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <h1 className="text-lg lg:text-2xl font-bold mb-6 text-blue-900">Transactions</h1>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions"
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md bg-white hover:bg-gray-100 text-sm"
          >
            <FiFilter />
            {filterStatus === 'completed'
              ? 'Completed'
              : filterStatus === 'pending'
              ? 'Pending'
              : filterStatus === 'approved'
              ? 'Approved'
              : filterStatus === 'rejected'
              ? 'Rejected'
              : 'All'}
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow z-10">
              {['All', 'Completed', 'Pending', 'Approved', 'Rejected'].map((status) => (
                <div
                  key={status}
                  onClick={() => {
                    setFilterStatus(status === 'All' ? null : status.toLowerCase());
                    setFilterOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                    filterStatus === status.toLowerCase() ? 'font-semibold text-blue-600' : ''
                  }`}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {paginatedTransactions.length === 0 ? (
          <p className="text-gray-500 text-center">No transactions found.</p>
        ) : (
          paginatedTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((txn) => (
            <motion.div
              key={txn.id}
              className="flex items-start justify-between bg-white border rounded p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelected(txn)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    txn.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {txn.type === 'deposit' ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[2px]">
                  <FiCreditCard className="text-gray-400 text-xs" />
                </div>
              </div>
              <div className="flex-1 ml-4">
                <div className="font-medium text-sm capitalize">
                  {txn.type} via {txn.selectedWallet.currency}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {formatDate(txn.createdAt)} · {txn.status}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold text-sm ${
                    txn.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {txn.type === 'deposit' ? '+' : '-'}
                  {Number(txn.amount).toLocaleString()} USD
                </div>
                <div className="text-xs text-gray-400">
                  {Number(txn.amount).toLocaleString()} USD
                </div>
              </div>
              <FiChevronRight className="ml-3 text-gray-400" />
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-6">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Prev
          </button>
          <span>
            Page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      )}

      {/* Transaction Modal */}
      {selected && (
        <motion.div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <motion.div className="bg-white w-full max-w-lg p-6 lg:p-10 shadow-xl relative rounded-xl">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <FiX size={24} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  selected.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}
              >
                {selected.type === 'deposit' ? (
                  <FiArrowDownLeft size={18} />
                ) : (
                  <FiArrowUpRight size={18} />
                )}
              </div>
              <div>
                <h2 className="text-base font-semibold capitalize text-gray-800">{selected.type}</h2>
                <p className="text-sm text-gray-500">
                  {formatDate(selected.createdAt)} · {selected.status}
                </p>
              </div>
            </div>

            {/* Transaction ID */}
            <div className="text-sm text-gray-600 mb-4">
              Transaction ID: <span className="text-gray-800 font-medium">#{selected.id}</span>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <DetailRow label="Currency" valueClassName="capitalize" value={selected.selectedWallet?.currency} />
              <DetailRow
                label="Amount"
                value={`$${Number(selected.amount || 0).toLocaleString()} USD`}
              />
              <DetailRow label="Status" valueClassName="capitalize" value={selected.status} />
            </div>
          </motion.div>
        </motion.div>
      )}
</div>
);
};

export default TransactionsPage;