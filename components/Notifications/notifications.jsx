import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiXCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

const Notification = ({ type = "success", message, show, onClose }) => {
  const icons = {
    success: <FiCheckCircle className="text-green-500" size={24} />,
    error: <FiXCircle className="text-red-500" size={24} />,
    info: <FiInfo className="text-blue-500" size={24} />,
    warning: <FiAlertTriangle className="text-yellow-500" size={24} />,
  };

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`z-[9999] fixed top-5 right-5 w-80 bg-white shadow-lg rounded-lg flex items-center p-4 border-l-4 
            ${type === "success" ? "border-green-500" : ""}
            ${type === "error" ? "border-red-500" : ""}
            ${type === "info" ? "border-blue-500" : ""}
            ${type === "warning" ? "border-yellow-500" : ""}`}
        >
          <div className="mr-3">{icons[type]}</div>
          <div className="flex-1 text-sm text-gray-800">{message}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
