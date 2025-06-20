// pages/dashboard/plans.js
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
// Importing the new InvestmentPlans component from its dedicated file
import InvestmentPlans from '@/components/Dashboard/InvestmentPlans'; // <--- NOW IMPORTS FROM THE NEW FILE

import React from 'react';

function Plans() {
  return (
    <DashboardLayout>
        {/* Render the InvestmentPlans component here */}
        <InvestmentPlans />
    </DashboardLayout>
  );
}

export default Plans;
