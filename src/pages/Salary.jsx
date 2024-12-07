import React, { useState, useEffect } from 'react';
import { db, auth ,app} from '../config/firebase';
import { collection, getDocs, setDoc, doc,getFirestore} from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faCheckCircle, faCalendarAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import  DatePicker from "react-datepicker"; // For selecting a date
const Salary = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [selectedRole, setSelectedRole] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState(["Permanent","Temporary","Dailywages"]);
  const currentUser = auth.currentUser;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const db = getFirestore(app); 
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

 
const [attendanceData, setAttendanceData] = useState([]); // To store the fetched data

// Handle date change
const handleDateChange = (date) => {
  setSelectedDate(date);
  fetchAttendanceData(date, selectedFilter, selectedRole);
};
const fetchAttendanceData = async () => {
  setLoading(true);

  // Format the date to match Firestore path
  const year = selectedDate.getFullYear();
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
  const day = selectedDate.getDate().toString().padStart(2, "0");

  // Construct the Firestore document path
  const datePath = `${year}-${month}-${day}`;
  const email = "mathu@gmail.com"; // Use dynamic email or fetch from user context

  const dataRef = db.collection("admins")
    .doc(email) // Reference to the user's data
    .collection("attendance")
    .doc("permanent")
    .collection(year + "-" + month) // Year-Month folder
    .doc(datePath); // Specific day document

  try {
    const snapshot = await dataRef.get();

    if (snapshot.exists) {
      const data = snapshot.data();
      // Filter data by selected role if required
      const filteredData = Object.values(data).filter(
        (item) => !selectedRole || item.role === selectedRole
      );
      setAttendanceData(filteredData);
    } else {
      setAttendanceData([]);
    }
  } catch (error) {
    console.error("Error fetching attendance data: ", error);
    setAttendanceData([]);
  }

  setLoading(false);
};

  const handleViewSalary = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };
  const handleFilterChange = (value) => {
    setSelectedFilter(value);
  };

  const handleRoleChange = (value) => {
    setSelectedRole(value);
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

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedFilter, selectedRole, selectedDate]);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <FontAwesomeIcon icon={faMoneyBill} className="text-3xl text-blue-600 mr-3" />
        <h1 className="text-3xl font-semibold text-gray-700">Payroll Management System</h1>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
          className="p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Role:</label>
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value)}
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
      {/* Display the filtered attendance data */}
      <div>
        <h3 className="font-medium">Attendance Records</h3>
        {loading ? (
          <p>Loading...</p>
        ) : attendanceData.length === 0 ? (
          <p>No data available for the selected filters.</p>
        ) : (
          <ul>
            {attendanceData.map((data, index) => (
              <li key={index} className="border-b py-2">
                <div>Name: {data.employeeName}</div>
                <div>Attendance Status: {data.attendanceStatus}</div>
              </li>
            ))}
          </ul>
        )}
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
