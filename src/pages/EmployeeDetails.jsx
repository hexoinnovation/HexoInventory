import React, { useState } from "react";

// App Component
const App = () => {
  // Employee list state
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "555-555-5555",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "555-555-1234",
    },
  ]);

  // State to manage selected employee for viewing or editing
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // State for managing modal visibility and new employee form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Select employee for viewing or editing
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsEditing(false);
  };

  // Handle adding a new employee
  const handleAddEmployee = () => {
    setEmployees((prev) => [...prev, { ...newEmployee, id: prev.length + 1 }]);
    setNewEmployee({ name: "", email: "", phone: "" }); // Reset the form
    setIsModalOpen(false); // Close the modal
  };

  // Handle editing an employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
  };

  // Handle saving the edited employee
  const handleSaveEmployee = (updatedEmployee) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
    );
    setIsEditing(false);
    setSelectedEmployee(updatedEmployee);
  };

  // Handle input change in modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  // Employee List Component
  const EmployeeList = ({ employees, onSelectEmployee, onEditEmployee }) => {
    return (
      <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200 mb-8">
        <table className="min-w-full table-auto">
          <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr
                key={employee.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="border px-6 py-4">{employee.id}</td>
                <td className="border px-6 py-4">{employee.name}</td>
                <td className="border px-6 py-4">{employee.email}</td>
                <td className="border px-6 py-4">{employee.phone}</td>
                <td className="border px-6 py-4">
                  <button
                    onClick={() => onSelectEmployee(employee)}
                    className="text-purple-500 hover:text-purple-700 focus:outline-none"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEditEmployee(employee)}
                    className="ml-4 text-yellow-500 hover:text-yellow-700 focus:outline-none"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Employee Edit Component
  const EmployeeEdit = ({ employee, onSave }) => {
    const [updatedEmployee, setUpdatedEmployee] = useState(employee);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setUpdatedEmployee((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(updatedEmployee);
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 shadow-xl rounded-lg w-full sm:w-96"
      >
        <div>
          <label className="block text-lg font-semibold text-gray-700">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={updatedEmployee.name}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={updatedEmployee.email}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-lg font-semibold text-gray-700">
            Phone
          </label>
          <input
            type="text"
            name="phone"
            value={updatedEmployee.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    );
  };

  // Modal for adding a new employee
  const Modal = ({ isOpen, onClose, onAddEmployee }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl w-half sm:w-30">
          <h2 className="text-2xl font-semibold text-center text-purple-600 mb-6">
            Add New Employee
          </h2>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={newEmployee.name}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={newEmployee.email}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={newEmployee.phone}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={onAddEmployee}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                Add Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold text-center text-purple-600 mb-8">
        Employee Management System
      </h1>

      {/* Button to open Add New Employee Modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:from-teal-600 hover:to-blue-600 mb-8"
      >
        Add New Employee
      </button>

      {/* Employee List */}
      <EmployeeList
        employees={employees}
        onSelectEmployee={handleSelectEmployee}
        onEditEmployee={handleEditEmployee}
      />

      {/* Employee Detail */}
      {selectedEmployee && !isEditing && (
        <div className="bg-white p-6 shadow-xl rounded-xl mb-8">
          <h2 className="text-xl font-semibold text-purple-600 mb-4">
            Employee Details
          </h2>
          <p>
            <strong>Name:</strong> {selectedEmployee.name}
          </p>
          <p>
            <strong>Email:</strong> {selectedEmployee.email}
          </p>
          <p>
            <strong>Phone:</strong> {selectedEmployee.phone}
          </p>
          <button
            onClick={() => handleEditEmployee(selectedEmployee)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-lg mt-4 hover:from-yellow-600 hover:to-yellow-700"
          >
            Edit Employee
          </button>
        </div>
      )}

      {/* Edit Employee Form */}
      {isEditing && (
        <EmployeeEdit employee={selectedEmployee} onSave={handleSaveEmployee} />
      )}

      {/* Modal for Adding New Employee */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddEmployee={handleAddEmployee}
      />
    </div>
  );
};

export default App;
