import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faCheckCircle, faCalendarAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Salary = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = auth.currentUser;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const empDetailsRef = collection(db, 'admins', currentUser.email, 'Empdetails');
        const querySnapshot = await getDocs(empDetailsRef);
        const fetchedEmployees = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(fetchedEmployees);
        setFilteredEmployees(fetchedEmployees);

        // Extract unique roles for the dropdown
        const uniqueRoles = [...new Set(fetchedEmployees.map((emp) => emp.role))];
        setRoles(uniqueRoles);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    fetchEmployees();
  }, [currentUser]);

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    filterData(selectedDate, role, selectedFilter); // Reapply filters with updated role
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    filterData(date, selectedRole, selectedFilter); // Reapply filters with updated date
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    filterData(selectedDate, selectedRole, filter); // Reapply filters with updated filter
  };

  const filterData = (date, role, filter) => {
    if (!date) return; // Don't filter if no date is selected

    const filtered = employees.filter((employee) => {
      let match = true;

      // Filter by role if selected
      if (role && employee.role !== role) {
        match = false;
      }

      // Filter by the selected filter (daily, weekly, monthly)
      const employeeDate = new Date(employee.date);
      const selectedDateObj = new Date(date);
      
      switch (filter) {
        case 'daily':
          if (employeeDate.toDateString() !== selectedDateObj.toDateString()) {
            match = false;
          }
          break;
        case 'weekly':
          const startOfWeek = selectedDateObj.getDate() - selectedDateObj.getDay(); // Get Sunday of the current week
          const endOfWeek = startOfWeek + 6; // Saturday
          selectedDateObj.setDate(startOfWeek);
          const weekStart = new Date(selectedDateObj);
          const weekEnd = new Date(selectedDateObj.setDate(endOfWeek));

          if (employeeDate < weekStart || employeeDate > weekEnd) {
            match = false;
          }
          break;
        case 'monthly':
          const monthStart = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1); // Start of the month
          const monthEnd = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0); // End of the month
          if (employeeDate < monthStart || employeeDate > monthEnd) {
            match = false;
          }
          break;
        default:
          break;
      }

      return match;
    });

    setFilteredEmployees(filtered);
  };

  const handleViewSalary = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  const handleMarkAsPaid = async () => {
    try {
      const paidStatusRef = doc(db, 'admins', currentUser.email, 'salary_paid', selectedEmployee.id);
      await setDoc(paidStatusRef, { paid: true, date: new Date() });
      Swal.fire({
        title: 'Salary Paid',
        text: `Salary for ${selectedEmployee.name} has been marked as paid.`,
        icon: 'success',
      });
    } catch (error) {
      console.error('Error marking as paid:', error);
      Swal.fire({
        title: 'Error',
        text: 'There was an error marking the salary as paid.',
        icon: 'error',
      });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <FontAwesomeIcon icon={faMoneyBill} className="text-3xl text-blue-600 mr-3" />
        <h1 className="text-3xl font-semibold text-gray-700">Payroll Management System</h1>
      </div>

      {/* Date Picker and Filter Options */}
      <div className="flex items-center mb-6">
        <div className="mr-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date:</label>
          <input
            type="date"
            value={selectedDate ? selectedDate : ''}
            onChange={(e) => handleDateChange(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mr-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter By:</label>
          <select
            value={selectedFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Role:</label>
          <select
            value={selectedRole}
            onChange={handleRoleChange}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">All Roles</option>
            {roles.map((role, index) => (
              <option key={index} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtered Employee Table */}
      <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-4 py-2 flex items-center gap-3">
                <img src={employee.photo} alt="Employee" className="rounded-full w-12 h-12 object-cover" />
                <span>{employee.name}</span>
              </td>
              <td className="p-3">{employee.role}</td>
              <td className="p-3">
                <button
                  onClick={() => handleViewSalary(employee)}
                  className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
                >
                  View Salary
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for displaying the salary details */}
      {modalVisible && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-semibold text-gray-700">Salary Details</h2>
            <div className="mt-4">
              <table className="min-w-full">
                <tbody>
                  <tr>
                    <td className="p-3 text-left font-medium">Name</td>
                    <td className="p-3">{selectedEmployee.name}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-left font-medium">Role</td>
                    <td className="p-3">{selectedEmployee.role}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-left font-medium">Salary</td>
                    <td className="p-3">{selectedEmployee.salary}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-left font-medium">Paid Status</td>
                    <td className="p-3">
                      {selectedEmployee.isPaid ? (
                        <span className="text-green-500">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                          Paid
                        </span>
                      ) : (
                        <span className="text-red-500">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                          Not Paid
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* Mark as Paid Button */}
              {!selectedEmployee.isPaid && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleMarkAsPaid}
                    className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600"
                  >
                    Mark as Paid
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setModalVisible(false)}
              className="mt-4 text-red-500 hover:text-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;
