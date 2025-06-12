import { useState } from "react";
import Notification from "../Notifications/notifications";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminSettings() {
  const [profile, setProfile] = useState({
    name: "Administrator",
    email: "admin@rosnep.org",
  });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState("success");
  const [notificationMessage, setNotificationMessage] = useState("N/a");
  const [loading, setLoading] = useState(false)

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    alert("Password updated!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      setNotificationMessage("New password and confirmation do not match.");
      setNotificationType("warning");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const user = auth.currentUser;

      if (!user) {
        // console.error("User not authenticated.");
        setLoading(false);
        setNotificationMessage("User not authenticated.");
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        return;
      }

      // Reauthenticate the user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        passwords.current
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwords.new);
      setLoading(false);
      setNotificationMessage("Password changed successfully.");
      setNotificationType("success");
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      // Optionally, reset the form
      setPasswords({
        current: "",
        new: "",
        confirm: "",
      });
    } catch (error) {
      console.error("Error changing password:", error.message);
      setLoading(false);

      let message = "Error changing password. Please try again.";

      if (error.code === "auth/invalid-credential") {
        message =
          "Your current password is invalid. Please try again.";
      }

      setNotificationMessage(message);
      setNotificationType("error");
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-lg lg:text-2xl font-bold text-blue-900 mb-6">
        Admin Settings
      </h1>

      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Left column: Min withdrawal + Admin profile */}
        <div className="flex-1 space-y-4 lg:space-y-6">
          {/* Admin Profile */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base lg:text-lg font-semibold mb-4">
              Admin Profile
            </h2>
            <label
              htmlFor="name"
              className="text-gray-700 font-medium mb-1 block"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={profile.name}
              readOnly
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 bg-gray-100 cursor-not-allowed focus:outline-none"
            />
            <label
              htmlFor="email"
              className="text-gray-700 font-medium mb-1 block"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              readOnly
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed focus:outline-none"
            />
          </div>

          {/* Minimum Withdrawal */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-base lg:text-lg font-semibold mb-4">
              Minimum Withdrawal Amount
            </h2>
            <input
              type="text"
              readOnly
              value="$50.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        {/* Right column: Change password */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-base lg:text-lg font-semibold mb-4">
            Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="current"
                className="text-gray-700 font-medium mb-1 block"
              >
                Current Password<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="current"
                name="current"
                type="password"
                value={passwords.current}
                onChange={handlePasswordChange}
                placeholder="********"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="new"
                className="text-gray-700 font-medium mb-1 block"
              >
                New Password<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="new"
                name="new"
                type="password"
                value={passwords.new}
                onChange={handlePasswordChange}
                placeholder="********"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="text-gray-700 font-medium mb-1 block"
              >
                Confirm New Password<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                value={passwords.confirm}
                onChange={handlePasswordChange}
                placeholder="********"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full flex justify-center items-center mt-2 bg-blue-800 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-md transition"
            >
              {loading ? (
                <div className="border-2 border-gray-200 border-t-2 border-t-transparent rounded-full w-6 h-6 spinner"></div>
              ) : (
                <div className="text-white text-center h-6">
                  Update Password
                </div>
              )}
            </button>
          </form>
        </div>
      </div>

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
}
