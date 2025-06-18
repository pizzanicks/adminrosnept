// pages/dashboard/users/[id].js
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/Dashboard/DashboardLayout'; // Assuming this path is correct
import UserDetailsContent from '../../../components/Dashboard/UserDetailsContent'; // <--- CORRECTED PATH HERE

/**
 * UserDetailsPage is a Next.js dynamic page for displaying individual user details.
 * It extracts the user ID from the URL and passes it to the UserDetailsContent component.
 */
export default function UserDetailsPage() {
    const router = useRouter();
    // Destructure 'id' from router.query. This 'id' corresponds to the '[id]' in the file name.
    const { id } = router.query;

    // Show a basic loading state while the ID is being resolved
    if (!id) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen text-gray-500">
                    Loading user details...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* The "Back to Users" button belongs here as useRouter is available in the Page component */}
            <button
                onClick={() => router.back()}
                className="text-sm text-blue-600 hover:underline p-4" // Added some padding for better click area
            >
                ← Back to Users
            </button>
            {/* Render the UserDetailsContent component, passing the extracted ID as a prop */}
            <UserDetailsContent userId={id} />
        </DashboardLayout>
    );
}
