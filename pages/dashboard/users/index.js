import React from 'react'
import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import ManageUsers from '@/components/Dashboard/Users'

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Manage Users</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <ManageUsers />
        </div>
      </div>
    </DashboardLayout>
  )
}
