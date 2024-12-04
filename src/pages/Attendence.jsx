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
  const [filteredData, setFilteredData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
 
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
      try {
        const userDocRef = collection(db, "admins", currentUser.email, "Empdetails");
        const querySnapshot = await getDocs(userDocRef);
    
        const fetchedEmployees = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
    
        // Fetch attendance data for the specific date
        const attendanceRef = doc(db, "admins", currentUser.email, "attendance", formattedDate);
        const docSnap = await getDoc(attendanceRef);
    
        if (docSnap.exists()) {
          const attendanceData = docSnap.data();
          console.log("Fetched Attendance Data:", attendanceData);
    
          const updatedEmployees = fetchedEmployees.map((employee) => {
            const attendanceRecord = attendanceData.employees.find((att) => att.id === employee.id);
            
            // Log to check if attendance data is being matched correctly
            console.log(`Attendance for ${employee.name}:`, attendanceRecord);
    
            return {
              ...employee,
              attendance: attendanceRecord ? attendanceRecord.status : 'Absent', // Default to 'Absent' if not found
            };
          });
    
          setEmployees(updatedEmployees);
          setFilteredEmployees(updatedEmployees); // Update filtered employees state
        } else {
          console.log("No attendance data for the selected date.");
          const defaultAttendance = fetchedEmployees.map((employee) => ({
            ...employee,
            attendance: "Absent", // Default all employees to 'Absent' if no data is found
          }));
          setEmployees(defaultAttendance);
          setFilteredEmployees(defaultAttendance); // Set filtered employees to default attendance
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
  
    if (currentUser && currentUser.email) {
      fetchEmployees();
    }
  }, [currentUser, formattedDate]);
  
  const filterAttendance = async (value, isMonth) => {
    console.log("Filtering data for:", value, "Is Month Filter?", isMonth);
  
    try {
      let queryDate = value;
  
      // If it's a month filter (yyyy-MM), we need to transform it into MM.yyyy format
      if (isMonth) {
        // Ensure value is in 'yyyy-MM' format, like '2024-12'
        const [year, month] = value.split('-'); // Split the value to extract year and month
        queryDate = `${month}.${year}`; // Format to 'MM.yyyy' (e.g., '12.2024')
      }
  
      console.log("Querying attendance for:", queryDate);
  
      // Query the attendance for the selected date
      const attendanceRef = doc(db, "admins", currentUser.email, "attendance", queryDate);
      const docSnapshot = await getDoc(attendanceRef);
  
      if (docSnapshot.exists()) {
        const data = docSnapshot.data().employees;
        console.log("Fetched Data:", data);
  
        // Update the employee status based on the attendance data
        const updatedData = data.map((employee) => {
          return {
            ...employee,
            attendance: employee.status,  
          };
        });
  
        setFilteredEmployees(updatedData); // Update the filtered employees
      } else {
        console.log("No data found for the selected date.");
        setFilteredEmployees([]); // Clear the filtered data if no attendance found
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };
  
  const handleStatusToggle = (employeeId, currentStatus) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
    console.log("Toggling status for:", employeeId, "Current Status:", currentStatus, "New Status:", newStatus);
  
    const updatedEmployees = filteredEmployees.map((employee) => {
      if (employee.id === employeeId) {
        return { ...employee, attendance: newStatus }; // Update attendance status for the selected employee
      }
      return employee;
    });
  
    setFilteredEmployees(updatedEmployees); // Update the state with the new employee list
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
        status: attendance[employee.id] || employee.attendance || "Absent",
        date: formattedDate, // Keep the original dd.mm.yyyy format here
      }));
  
      // Use only the month and year for Firestore
      const [month, year] = formattedDate.split('.');
      const formattedMonthYear = `${month}.${year}`; // Save in mm.yyyy format
  
      const attendanceRef = doc(db, "admins", currentUser.email, "attendance", formattedMonthYear);
      await setDoc(attendanceRef, { employees: attendanceData });
  
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };
 const handleFilterChange = (e) => {
  const selectedValue = e.target.value;
  console.log("Selected Value:", selectedValue); // Log the selected value for debugging
  
  if (selectedValue === "All") {
    // If "All" is selected, display all employees (ignore status filtering)
    setStatusFilter('All');
    setFilteredEmployees(employees); // Reset to show all employees
  } else if (selectedValue === "Present" || selectedValue === "Absent") {
    // If "Present" or "Absent" is selected, filter based on attendance
    setStatusFilter(selectedValue);
    const filteredByStatus = employees.filter(employee => employee.attendance === selectedValue);
    setFilteredEmployees(filteredByStatus);
  } else if (e.target.type === 'date') {
    // If it's a date input, the value will be in 'yyyy-mm-dd' format
    const formattedDate = convertToDDMMYYYY(selectedValue); // Convert to 'dd.mm.yyyy'
    filterAttendance(formattedDate, false); // Use 'false' for exact date filter
  } else if (e.target.type === 'month') {
    // If it's a month input, format it to 'MM.yyyy'
    const formattedMonth = selectedValue.replace('-', '.'); // Convert 'yyyy-mm' to 'mm.yyyy'
    filterAttendance(formattedMonth, true); // Use 'true' for month filter
  }
};

const handleMonthlyFilter = (e) => {
  const isChecked = e.target.checked;
  setMonthlyFilter(isChecked); // Toggle the monthly filter visibility
  if (isChecked && filterDate) {
    // If the filter is checked and a month is selected, filter by that month
    filterAttendance(filterDate, true);
  } else {
    // If unchecked, you can either reset the filtered data or show all employees
    setFilteredEmployees(employees);
  }
};

  const convertToDDMMYYYY = (date) => {
    // Check if the date is in 'yyyy-mm-dd' format and convert it to 'dd.mm.yyyy'
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`; // Convert to 'dd.mm.yyyy' format
  };
  
  const formatMonthToDDMMYYYY = (month) => {
    const [year, monthNumber] = month.split("-");
    return `01.${monthNumber.padStart(2, "0")}.${year}`;
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
        <td className="px-4 py-2 flex items-center gap-3">
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
              handleStatusToggle(employee.id, employee.attendance);
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
  )}
</tbody>

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
    disabled={monthlyFilter} // Disable date picker if monthly filter is active
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
      onChange={handleFilterChange} // Use the same function for both date and month handling
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
