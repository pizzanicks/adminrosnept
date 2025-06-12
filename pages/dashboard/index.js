import DashboardLayout from '@/components/Dashboard/DashboardLayout'
import Overview from '@/components/Dashboard/Overview'
import React from 'react'

function Index() {
  return (
    <>
        <DashboardLayout>
          <Overview />
        </DashboardLayout>
    </>
  )
}

export default Index