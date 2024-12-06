import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, getDocs, setDoc, doc ,getDoc} from 'firebase/firestore';
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
  const [selectedDate, setSelectedDate] = useState("");
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;
  const currentUser = auth.currentUser;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const [attendanceData, setAttendanceData] = useState([]); 
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
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value); // Set the selected date when the user selects a date
  };
// Salary.jsx
const fetchAttendanceByMonth = async () => {
  try {
    // Ensure selectedDate is not empty
    if (!selectedDate) {
      console.error("Selected date is empty!");
      return;  // Prevent fetching if the date is not set
    }

    // Encode the email for Firestore path
    const encodedEmail = encodeURIComponent(currentUser.email);

    // Construct the path, ensuring there are no extra slashes
    const path = `admins/${encodedEmail}/attendance/${selectedMonth}/${selectedDate}/data`;

    console.log("Fetching from path:", path);

    // Get the collection reference
    const dayCollectionRef = collection(db, path);

    // Fetch data from Firestore
    const attendanceSnapshot = await getDocs(dayCollectionRef);

    // Map the fetched data into an array
    const fetchedAttendanceData = attendanceSnapshot.docs.map(doc => doc.data());

    console.log("Fetched Attendance Data:", fetchedAttendanceData);

    // Update state with fetched data
    setAttendanceData(fetchedAttendanceData);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
  }
};

  useEffect(() => {
    fetchAttendanceByMonth();
  }, [selectedMonth, selectedDate]);
  const renderAttendanceDetails = (attendanceData) => {
    return attendanceData.map((employee, index) => (
      <div key={index}>
        <p>Name: {employee.name}</p>
        <p>Status: {employee.status}</p>
        <p>Role: {employee.role}</p>
        <p>Date: {employee.date}</p>
        <p>Contact: {employee.contact}</p>
        <p>DOB: {employee.dob}</p>
        <p>Email: {employee.email}</p>
      </div>
    ));
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
  <input
    type="date"
    value={selectedDate}
    onChange={handleDateChange} // Update the selected date on change
  />
  <label htmlFor="month">Select Month: </label>
      <select
        id="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      >
        <option value="Dec 2024">Dec 2024</option>
        <option value="Nov 2024">Nov 2024</option>
        <option value="Oct 2024">Oct 2024</option>
        {/* Add more months here */}
      </select>

      <div>{renderAttendanceDetails(attendanceData)}</div>
      </div>
    {/* <div className="relative">
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
    </div> */}
  
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
