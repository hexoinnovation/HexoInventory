import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase'; // Import Firebase setup
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faClock } from '@fortawesome/free-solid-svg-icons';

const AttendanceTable = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [monthlyFilter, setMonthlyFilter] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('all'); // <-- Add this line

  const currentUser = auth.currentUser;
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;
  // const currentDate = new Date();
  // const formattedDate = `${currentDate.getUTCDate()}.${currentDate.getUTCMonth() + 1}.${currentDate.getUTCFullYear()}`;
  //const formattedDate = `${currentDate.getUTCDate()}.${currentDate.getUTCMonth() + 1}.${currentDate.getUTCFullYear()}`;
  const attendanceRef = doc(db, 'admins', currentUser.email, 'attendance', formattedDate);
  //const docSnap = await getDoc(attendanceRef);
  
  useEffect(() => {
    const fetchEmployees = async () => {
      console.log('Fetching employees...');
      try {
        const userDocRef = collection(db, 'admins', currentUser.email, 'Empdetails');
        const querySnapshot = await getDocs(userDocRef);
  
        if (querySnapshot.empty) {
          console.log('No employees found');
        }
  
        const fetchedEmployees = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        console.log('Fetched Employees:', fetchedEmployees);
  
        setEmployees(fetchedEmployees);
        setFilteredEmployees(fetchedEmployees);
  
        // Fetching attendance data for today (formattedDate)
        const attendanceRef = doc(db, 'admins', currentUser.email, 'attendance', formattedDate);
        const docSnap = await getDoc(attendanceRef);
  
        if (docSnap.exists()) {
          console.log('Attendance for today:', docSnap.data());
          const attendanceData = docSnap.data();
  
          // Merge employee data with their attendance status
          const updatedEmployees = fetchedEmployees.map((employee) => {
            return {
              ...employee,
              attendance: attendanceData.employees.find((att) => att.id === employee.id)?.status || 'Absent',
            };
          });
  
          setEmployees(updatedEmployees); // Set the updated employees with attendance status
          setFilteredEmployees(updatedEmployees); // Update filtered employees as well
        } else {
          console.log('No attendance data for today. Setting default to "Absent"');
          const initialAttendance = fetchedEmployees.map((employee) => ({
            ...employee,
            attendance: 'Absent', // Default to 'Absent'
          }));
  
          setEmployees(initialAttendance);
          setFilteredEmployees(initialAttendance);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    if (currentUser && currentUser.email) {
      fetchEmployees();
    } else {
      console.log('No current user found');
    }
  }, [currentUser, formattedDate]);
  
  const handleStatusToggle = (employeeId, currentStatus) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
  
    // Update the specific employee's status in filteredEmployees
    const updatedEmployees = filteredEmployees.map((employee) => {
      if (employee.id === employeeId) {
        return {
          ...employee,
          attendance: newStatus, // Update the attendance
        };
      }
      return employee;
    });
  
    setFilteredEmployees(updatedEmployees); // Update the filtered employees array
  
    // Also track changes explicitly in the attendance object
    setAttendance((prev) => ({
      ...prev,
      [employeeId]: newStatus,
    }));
  };
  const saveAttendance = async () => {
    try {
      const attendanceData = filteredEmployees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        contact: employee.contact,
        email: employee.email,
        dob: employee.dob,
        photo: employee.photo,
        // Use the updated status if it exists in `attendance`; otherwise, keep the current employee.attendance
        status: attendance[employee.id] || employee.attendance || "Absent", 
        date: formattedDate,
      }));
  
      const attendanceRef = doc(db, "admins", currentUser.email, "attendance", formattedDate);
      await setDoc(attendanceRef, { employees: attendanceData });
  
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };
  
  const [statusFilter, setStatusFilter] = useState("All");
  const handleMonthlyFilter = (e) => {
    setMonthlyFilter(e.target.checked);
    setFilterDate(""); // Reset date filter when toggling monthly filter
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "status") {
      setStatusFilter(value);
    } else if (name === "date") {
      const formattedDate = formatDateToDDMMYYYY(value); // Specific date (DD.MM.YYYY)
      setFilterDate(formattedDate);
    } else if (name === "month") {
      const formattedMonth = formatMonthToDDMMYYYY(value); // Format the month correctly (DD.MM.YYYY)
      setFilterDate(formattedMonth);
    }
  };
  useEffect(() => {
    let filtered = employees;
  
    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((employee) => employee.attendance === statusFilter);
    }
  
    // Apply date filter (for specific date)
    if (filterDate) {
      filtered = filtered.filter((employee) => {
        if (employee.date) {  // Check if employee.date is defined
          const employeeDate = employee.date.split('.').reverse().join('-'); // Convert DD.MM.YYYY to YYYY-MM-DD
          return employeeDate === filterDate;
        }
        return false; // If employee.date is not defined, don't include the employee
      });
    }
  
    // Apply monthly filter (for the whole month)
    if (monthlyFilter && filterDate) {
      const selectedMonth = filterDate.split(".")[1]; // Extract month from filterDate
      filtered = filtered.filter((employee) => {
        if (employee.date) {  // Check if employee.date is defined
          const employeeMonth = employee.date.split(".")[1]; // Extract month from employee's date
          return employeeMonth === selectedMonth;
        }
        return false; // If employee.date is not defined, don't include the employee
      });
    }
  
    setFilteredEmployees(filtered);
  }, [statusFilter, filterDate, monthlyFilter, employees]);
  
const formatDateToDDMMYYYY = (date) => {
  const currentDate = new Date(date);
  const day = currentDate.getDate().toString().padStart(2, "0");
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const year = currentDate.getFullYear();
  return `${day}.${month}.${year}`;  // This will give you DD.MM.YYYY format
};
const formatMonthToDDMMYYYY = (month) => {
  const [year, monthNumber] = month.split('-');
  const formattedDate = `01.${monthNumber.padStart(2, '0')}.${year}`;
  return formattedDate;
};
  const formatDate = (date) => {
    const [day, month, year] = date.split('.'); // Split the string by dot
    const formattedDate = new Date(year, month - 1, day); // Create a new Date object
    return formattedDate.toLocaleDateString(); // Format and return the date
  };
  const [attendanceData, setAttendanceData] = useState([]);
  // Helper function to format DOB
  const convertToDateFormat = (dateString) => {
    const [day, month, year] = dateString.split('.');
    return new Date(`${year}-${month}-${day}`); // Format the date for JavaScript
  };
  
  // Open employee details modal
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  // const [ setCurrentDate] = useState(new Date());

  // useEffect(() => {
  //   // Function to update time
  //   const interval = setInterval(() => {
  //     setCurrentDate(new Date()); // Update the current time every second
  //   }, 1000);

  //   // Cleanup the interval on component unmount
  //   return () => clearInterval(interval);
  // }, []);
  const handleOpenModal = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true); // Show the modal
  };

  const handleCloseModal = () => {
    setModalVisible(false); // Hide the modal
    setSelectedEmployee(null); // Reset selected employee
  };
  
  
  return (
    <div className="w-full flex">
      <div className="w-3/4 bg-white p-4 rounded-lg shadow-lg overflow-x-auto">
        <div className="w-full flex flex-col items-start mb-4">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4 ml-0 mt-5 animate__animated animate__fadeIn">
            Attendance for {formattedDate}
          </h2>
          <div className="flex items-center text-sm font-semibold text-gray-600 ml-0 animate__animated animate__fadeIn animate__delay-1s">
      <FontAwesomeIcon icon={faClock} className="text-indigo-600 ml-0 mr-2 animate__animated animate__bounceIn" />
      <span>Current Time: {currentDate.toLocaleTimeString()}</span> {/* Display time */}
    </div>
          <h2 className="text-xl font-semibold text-indigo-600 mt-8">Employee Attendance</h2>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-indigo-100">
                <th className="px-4 py-2 text-left text-sm font-semibold">Employee</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">DOB</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Contact</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
            {filteredEmployees.length === 0 ? (
  <tr>
    <td colSpan="5" className="text-center py-4 text-red-500 font-semibold">
      No Employee Found
    </td>
  </tr>
) : (
  filteredEmployees.map((employee) => (
    <tr key={employee.id} className="border-b hover:bg-indigo-50 cursor-pointer">
     <td
                className="px-4 py-2 flex items-center gap-3"
                onClick={() => handleOpenModal(employee)} // Open modal on click
              >
        <img
          src={employee.photo}
          alt="Employee"
          className="rounded-full w-12 h-12 object-cover"
        />
        <span>{employee.name}</span>
      </td>
      <td className="px-4 py-2">{employee.dob}</td>
      <td className="px-4 py-2">{employee.contact}</td>
      <td className="px-4 py-2">{employee.email}</td>
      <td className="px-4 py-2">
      <button
  onClick={(e) => {
    e.stopPropagation();
    handleStatusToggle(employee.id, employee.attendance); // Pass employee's current attendance
  }}
  className={`py-1 px-4 bg-${employee.attendance === 'Present' ? 'green' : 'red'}-500 text-white rounded-md`}
>
  {employee.attendance === 'Present' ? (
    <FontAwesomeIcon icon={faCheck} />
  ) : (
    <FontAwesomeIcon icon={faTimes} />
  )}
</button>

      </td>
    </tr>
  ))
)}            </tbody>
          </table>
          <div className="mt-4">
            <button onClick={saveAttendance} className="px-6 py-2 bg-blue-500 text-white rounded-md">
              Save All
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel (Right Side) */}
      <div className="w-1/4 bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">Filters</h2>
      
      {/* Status Filter */}
      <div className="mb-4">
        <label htmlFor="status" className="text-sm font-semibold">Status</label>
        <select
          name="status"
          value={statusFilter}
          onChange={handleFilterChange}
          className="w-full px-4 py-2 mt-2 border rounded-lg"
        >
          <option value="All">All Status</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      {/* Date Filter */}
      <div className="mb-4">
        <label htmlFor="date" className="text-sm font-semibold">Date</label>
        <input
          type="date"
          name="date"
          value={filterDate}  
          onChange={handleFilterChange}
          className="w-full px-4 py-2 mt-2 border rounded-lg"
        />
      </div>

      {/* Monthly Filter */}
      <div className="mb-4 flex items-center gap-3">
  <input
    type="checkbox"
    checked={monthlyFilter}
    onChange={handleMonthlyFilter}
    id="monthlyFilter"
    className="h-5 w-5"
  />
  <label htmlFor="monthlyFilter" className="text-sm font-semibold">Monthly Filter</label>
</div>


      {/* Show month selector only if monthly filter is checked */}
      {monthlyFilter && (
        <div className="mb-4">
          <label htmlFor="month" className="text-sm font-semibold">Select Month</label>
          <input
            type="month"
            name="month"
            value={filterDate}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 mt-2 border rounded-lg"
          />
        </div>
      )}
    </div>

      {/* Modal for Employee Details */}
      {modalVisible && selectedEmployee && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">{selectedEmployee.name}</h2>
            <div className="flex justify-center mb-4">
              <img
                src={selectedEmployee.photo}
                alt={selectedEmployee.name}
                className="rounded-full w-37 h-32 object-cover"
              />
            </div>
            <p><strong>Date of Birth:</strong> {selectedEmployee.dob}</p>
            <p><strong>Contact:</strong> {selectedEmployee.contact}</p>
            <p><strong>Address:</strong> {selectedEmployee.address}</p>
            <p><strong>State:</strong> {selectedEmployee.state}</p>
            <p><strong>Country:</strong> {selectedEmployee.country}</p>
            
            <p><strong>Email:</strong> {selectedEmployee.email}</p>
            <button onClick={handleCloseModal} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
