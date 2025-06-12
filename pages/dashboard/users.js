import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import ManageUsers from '@/components/Dashboard/Users'
import React from 'react'

function Users() {
  return (
    <DashboardLayout>
        <ManageUsers />
    </DashboardLayout>
  )
}

export default Users