// pages/dashboard/profile.js
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

/**
 * This is a placeholder page for the logged-in administrator's profile.
 * It serves as a temporary page to ensure the "Users" menu link works
 * and can be developed further later.
 */
export default function AdminProfilePage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <h1 className="text-2xl font-bold mb-6">Your Admin Profile</h1>
        <p className="text-gray-700">
          This is your personal profile page as an administrator.
          You can add your own admin-specific details and settings here.
        </p>
        {/* You will add more content here later, like forms to update admin info */}
      </div>
    </DashboardLayout>
  );
}