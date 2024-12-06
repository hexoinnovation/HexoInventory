import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faCheckCircle, faCalendarAlt, faUser } from '@fortawesome/free-solid-svg-icons';

const Salary = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const currentUser = auth.currentUser;

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

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    filterData(month, selectedRole); // Reapply filters with updated month
  };
  
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    filterData(selectedMonth, role); // Reapply filters with updated role
  };
  
  const filterData = (month, role) => {
    const filtered = employees.filter((employee) => {
      let match = true;
  
      // Check if the date field exists and includes the selected month
      if (month && (!employee.date || !employee.date.includes(month))) {
        match = false;
      }
  
      // Check if the employee role matches the selected role
      if (role && employee.role !== role) {
        match = false;
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
      <div className="flex space-x-4 mb-4">
  {/* Month Picker with Icon */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Select Month:</label>
    <div className="relative">
      <input
        type="month"
        value={selectedMonth}
        onChange={handleMonthChange}
        className="p-2 border border-gray-300 rounded-md w-full pl-10" // Add padding to the left for the icon
      />
      <FontAwesomeIcon
        icon={faCalendarAlt}
        className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-800 "
      />
    </div>
  </div>

  {/* Role Dropdown with Icon */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Select Role:</label>
    <div className="relative">
      <select
        value={selectedRole}
        onChange={handleRoleChange}
        className="p-2 border border-gray-300 rounded-md w-full pl-10" // Add padding to the left for the icon
      >
        <option value="">All Roles</option>
        {roles.map((role, index) => (
          <option key={index} value={role}>
            {role}
          </option>
        ))}
      </select>
      <FontAwesomeIcon
        icon={faUser}
        className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-700"
      />
    </div>
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
              <td
        className="px-4 py-2 flex items-center gap-3"> <img
        src={employee.photo}
        alt="Employee"
        className="rounded-full w-12 h-12 object-cover"
      />
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
          <div className="bg-white p-6 rounded-lg w-1/2">
            <h3 className="text-2xl font-semibold mb-4 text-center text-blue-600">
              <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
              Salary Details for {selectedEmployee.name}
            </h3>
            
            {/* Display Salary Table */}
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Present Days</th>
                  <th className="p-3 text-left">Absent Days</th>
                  <th className="p-3 text-left">Total Working Days</th>
                  <th className="p-3 text-left">PF</th>
                  <th className="p-3 text-left">Gross Pay</th>
                  <th className="p-3 text-left">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3">{selectedEmployee.name}</td>
                  <td className="p-3">{selectedEmployee.role}</td>
                  <td className="p-3">10</td> {/* Replace with real data */}
                  <td className="p-3">5</td>  {/* Replace with real data */}
                  <td className="p-3">20</td> {/* Replace with real data */}
                  <td className="p-3">1000</td> {/* Replace with real data */}
                  <td className="p-3">5000</td> {/* Replace with real data */}
                  <td className="p-3">6000</td> {/* Replace with real data */}
                </tr>
              </tbody>
            </table>

            {/* Mark as Paid Button */}
            {!isPaid && (
              <button
                onClick={handleMarkAsPaid}
                className="bg-blue-500 text-white rounded px-4 py-2 mt-4 hover:bg-blue-600"
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Mark as Paid
              </button>
            )}
            {isPaid && (
              <div className="mt-4 text-green-500">
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Salary Paid
              </div>
            )}

            <button
              onClick={() => setModalVisible(false)}
              className="bg-red-500 text-white rounded px-4 py-2 mt-4 hover:bg-red-600"
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
