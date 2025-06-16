// components/Modal.js
import React, { useState, useEffect } from 'react';

const Modal = ({ plan, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    plan: '',
    subTitle: '',
    description: '',
    price: '',
    roi: '',
    highlights: [],
    points: [],
    cta: '',
    enabled: true,
    barColor: 'bg-green-500',
    buttonStyle: 'bg-green-600 text-white hover:bg-green-700 transition',
    min: 10000,
    max: 49999,
  });

  // Populate the form with existing plan data if editing
  useEffect(() => {
    if (plan) {
      setFormData({ ...plan });
    }
  }, [plan]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Submit the form data (either adding or updating)
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
        <h2 className="text-2xl font-semibold mb-4">{plan ? 'Edit Plan' : 'Add New Plan'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-semibold text-gray-700">Plan Name</label>
            <input
              type="text"
              value={formData.plan}
              onChange={(e) => handleChange('plan', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold text-gray-700">SubTitle</label>
            <input
              type="text"
              value={formData.subTitle}
              onChange={(e) => handleChange('subTitle', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold text-gray-700">Price</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold text-gray-700">ROI</label>
            <input
              type="text"
              value={formData.roi}
              onChange={(e) => handleChange('roi', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {plan ? 'Update Plan' : 'Add Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
