import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase'; // Import Firebase setup
import { collection, getDocs, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faClock } from '@fortawesome/free-solid-svg-icons';
  
import Swal from 'sweetalert2';
const AttendanceTable = () => {
  

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [monthlyFilter, setMonthlyFilter] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthlyAttendance, setMonthlyAttendance] = useState([]); 
  const [filteredMonthYear, setFilteredMonthYear] = useState(""); 
  const [RoleFilter, setRoleFilter] = useState("All");

  const currentUser = auth.currentUser;
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth() + 1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;
  const attendanceRef = doc(db, 'admins', currentUser.email, 'attendance', formattedDate);
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Fetch Employee Details
        const empDetailsRef = collection(db, "admins", currentUser.email, "Empdetails");
        const querySnapshot = await getDocs(empDetailsRef);
  
        const fetchedEmployees = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        // Extract current month and year
        const dateObj = new Date();
        const options = { month: "short", year: "numeric" };
        const currentMonthYear = dateObj.toLocaleDateString("en-US", options); // e.g., "Dec 2024"
  
        // Reference for attendance data
        const attendanceRef = collection(db, "admins", currentUser.email, "attendance");
        const monthDocRef = doc(attendanceRef, currentMonthYear); // Document for "Dec 2024"
        const dayCollectionRef = collection(monthDocRef, formattedDate); // Subcollection for "04.12.2024"
        const dayDocRef = doc(dayCollectionRef, "data"); // Document ID (e.g., "data")
  
        // Fetch attendance data
        const attendanceSnap = await getDoc(dayDocRef);
  
        if (attendanceSnap.exists()) {
          const attendanceData = attendanceSnap.data();
          console.log("Fetched Attendance Data:", attendanceData);
  
          const updatedEmployees = fetchedEmployees.map((employee) => {
            const attendanceRecord = attendanceData.employees.find(
              (att) => att.id === employee.id
            );
  
            return {
              ...employee,
              attendance: attendanceRecord ? attendanceRecord.status : "Absent", // Default to 'Absent' if no data
            };
          });
  
          setEmployees(updatedEmployees);
          setFilteredEmployees(updatedEmployees);
        } else {
          console.log("No attendance data for the selected date.");
          const defaultAttendance = fetchedEmployees.map((employee) => ({
            ...employee,
            attendance: "Absent", // Default to 'Absent'
          }));
          setEmployees(defaultAttendance);
          setFilteredEmployees(defaultAttendance);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    if (currentUser && currentUser.email) {
      fetchEmployees();
    }
  }, [currentUser, formattedDate]);

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
      // Prepare attendance data
      const attendanceData = filteredEmployees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        contact: employee.contact,
        email: employee.email,
        role: employee.role || "Unknown",
        dob: employee.dob,
        photo: employee.photo,
        status: attendance[employee.id] || employee.attendance || "Absent",
        date: formattedDate, // Original date in dd.mm.yyyy format
      }));
  
      // Extract current month and year in the desired format
      const dateObj = new Date(); // Adjust if you're using a specific date source
      const options = { month: 'short', year: 'numeric' };
      const currentMonthYear = dateObj.toLocaleDateString('en-US', options);
  
      // Reference for Firestore path
      const attendanceRef = collection(db, "admins", currentUser.email, "attendance");
  
      const monthDocRef = doc(attendanceRef, currentMonthYear); // "Dec 2024" as a document
      const dayCollectionRef = collection(monthDocRef, formattedDate); // "04.12.2024" as a subcollection
  
      // Save attendance data for the first path (with "data")
      const dayDocRef = doc(dayCollectionRef, "data"); // Document ID (can be "data" or any identifier)
      await setDoc(dayDocRef, { employees: attendanceData });
  
      // Save attendance data for the second path (without "data")
      const dayDocRefNoData = doc(attendanceRef, formattedDate); // Direct path without "data"
      await setDoc(dayDocRefNoData, { employees: attendanceData }); // Wrap the array in an object with a key
  
      // Show success alert using SweetAlert
      Swal.fire({
        icon: "success",
        title: "Attendance saved successfully!",
        text: `Attendance for ${currentMonthYear} on ${formattedDate} has been saved in both locations.`,
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
  
      // Show error alert using SweetAlert
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "There was an error saving the attendance. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };
  const handleMonthlyFilter = (e) => {
    const isChecked = e.target.checked;
    setMonthlyFilter(isChecked);
  
    if (isChecked && filterDate) {
      const selectedMonth = filterDate.split(".").slice(1).join("."); // Extract month and year from DD.MM.YYYY format
      filterAttendance(selectedMonth, true); // Apply the monthly filter
    } else if (!isChecked && filterDate) {
      filterAttendance(filterDate, false); // Revert to exact date filtering
    } else {
      setFilteredEmployees(employees); // Reset to all data
    }
  };
  const handleFilterChange = (e) => {
    const { type, value } = e.target; // Destructure to get type and value from event target
    console.log("Selected Value:", value); // Debugging log
  
    if (type === "date") {
      // Handle specific date selection
      const formattedDate = convertToDDMMYYYY(value); // Format selected date (e.g., 04.12.2024)
      setFilterDate(formattedDate); // Update state with the selected date
  
      if (monthlyFilter) {
        // If monthly filter is enabled, extract month and year
        const formattedMonth = value.slice(0, 7).replace("-", "."); // Format as "YYYY.MM"
        filterAttendance(formattedMonth, true); // Fetch attendance for the selected month
      } else {
        filterAttendance(formattedDate, false); // Fetch attendance for the exact date
      }
    } else if (type === "month") {
      // Handle month selection (if monthlyFilter uses a month picker)
      const formattedMonth = value.replace("-", "."); // Format selected month (e.g., 12.2024)
      setFilterDate(formattedMonth); // Update state with the selected month
      filterAttendance(formattedMonth, true); // Fetch attendance for the selected month
    } else if (value === "All") {
      // Handle "All" filter to show all employees
      setStatusFilter("All");
      if (filterDate) {
        filterAttendance(filterDate, monthlyFilter); // Apply date or month filter if set
      } else {
        setFilteredEmployees(employees); // Show all employees if no date/month filter is set
      }
    } else if (value === "Present" || value === "Absent") {
      // Handle "Present" or "Absent" filters
      setStatusFilter(value);
      if (filterDate) {
        // Apply both status and date/month filters
        filterAttendance(filterDate, monthlyFilter, value);
      } else {
        // Filter employees based on attendance status
        const filteredByStatus = employees.filter(
          (employee) => employee.attendance === value
        );
        setFilteredEmployees(filteredByStatus);
      }
    } else {
      console.warn("Unhandled filter type or value:", { type, value });
    }
  };
  
const convertToYYYYMMDD = (ddmmyyyy) => {
  const [day, month, year] = ddmmyyyy.split(".");
  return `${year}-${month}-${day}`; // Format for input type="date"
};

const convertToDDMMYYYY = (yyyymmdd) => {
  const [year, month, day] = yyyymmdd.split("-");
  return `${day}.${month}.${year}`; // Format for your attendance system
};
// Define month names for display
const monthNames = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const filterAttendance = async (value, isMonth, statusFilter = null) => {
  try {
      if (isMonth) {
          // Extract year and month from the value (e.g., "2024-11")
          const [year, month] = value.split("-");
          console.log(`Querying monthly attendance for: ${monthNames[parseInt(month, 10) - 1]} ${year}`);

          // Query Firestore for attendance records for the selected month
          const attendanceCollection = collection(db, "admins", currentUser.email, "attendance");
          const querySnapshot = await getDocs(attendanceCollection);

          let allEmployees = [];
          querySnapshot.forEach((doc) => {
              const record = doc.data();
              const recordDate = record.date; // Assuming `record.date` is in `dd.mm.yyyy`

              // Check if recordDate exists and is in the correct format
              if (recordDate && typeof recordDate === 'string' && recordDate.split(".").length === 3) {
                  const [recordDay, recordMonth, recordYear] = recordDate.split("."); // Split into day, month, year
                  console.log(`Found record with date: ${recordDate} (Day: ${recordDay}, Month: ${recordMonth}, Year: ${recordYear})`);

                  // Check if the year and month match
                  if (recordYear === year && recordMonth === month) {
                      allEmployees = [...allEmployees, ...record.employees];
                  }
              } else {
                  console.warn("Invalid or missing recordDate:", recordDate);
              }
          });

          // Apply status filter if needed
          let updatedData = allEmployees.map((employee) => ({
              ...employee,
              attendance: employee.status,
          }));

          if (statusFilter) {
              updatedData = updatedData.filter((employee) => employee.attendance === statusFilter);
          }

          setFilteredEmployees(updatedData);
      } else {
          // For exact date filtering (e.g., "02.12.2024")
          console.log("Exact date filter applied:", value);

          const attendanceRef = doc(db, "admins", currentUser.email, "attendance", value);
          const docSnapshot = await getDoc(attendanceRef);

          if (docSnapshot.exists()) {
              let data = docSnapshot.data().employees.map((employee) => ({
                  ...employee,
                  attendance: employee.status,
              }));

              if (statusFilter) {
                  data = data.filter((employee) => employee.attendance === statusFilter);
              }

              setFilteredEmployees(data);
          } else {
              console.log("No data found for the selected date.");
              setFilteredEmployees([]);
          }
      }
  } catch (error) {
      console.error("Error fetching attendance:", error);
  }
};

const handleRoleChange = (e) => {
  const selectedRole = e.target.value;
  setRoleFilter(selectedRole); // Set the selected role in state
  
  if (selectedRole === "All") {
    setFilteredEmployees(employees); // Show all employees if "All" is selected
  } else {
    // Filter the employees based on selected role
    const filtered = employees.filter((employees) => employees.role === selectedRole);
    setFilteredEmployees(filtered); // Set the filtered employees based on selected role
  }
};

  const handleOpenModal = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true); // Show the modal
  };
  const handleCloseModal = () => {
    setModalVisible(false); 
    setSelectedEmployee(null); 
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
                <th className="px-4 py-2 text-left text-sm font-semibold">Role</th>
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
        <td
        className="px-4 py-2 flex items-center gap-3"
        onClick={() => handleOpenModal(employee)} // Open modal when photo or name is clicked
      >
          <img
            src={employee.photo}
            alt="Employee"
            className="rounded-full w-12 h-12 object-cover"
          />
          <span>{employee.name}</span>
        </td>
        </td>
        <td className="px-4 py-2">{employee.dob}</td>
        <td className="px-4 py-2">{employee.contact}</td>
        <td className="px-4 py-2">{employee.role}</td>
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
          <button
  onClick={saveAttendance}
  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:from-indigo-400 hover:to-purple-400 transition-all duration-300"
>
  Save All
</button>
          </div>
        </div>
      </div>
     

      {/* Filter Panel (Right Side) */}
      <div className="w-1/4 bg-white p-4 rounded-lg shadow-lg ">
      <h2 className="text-xl font-semibold text-indigo-600 mb-5 mt-7">Filters</h2>
      
      {/* Status Filter */}
      <div className="mb-6">
  <label htmlFor="status" className="text-lg font-semibold text-gray-700">Status</label>
  <select
    name="status"
    value={statusFilter}
    onChange={handleFilterChange}
    className="w-full px-4 py-3 mt-2 rounded-lg bg-white border-2 border-gradient-to-r from-indigo-600 to-purple-600 
      hover:border-gradient-to-r hover:from-pink-500 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-400 
      transition duration-300 ease-in-out"
  >
    <option value="All">All Status</option>
    <option value="Present">Present</option>
    <option value="Absent">Absent</option>
  </select>
</div>

<div className="mb-6">
  <label htmlFor="role" className="text-lg font-semibold text-gray-700">Role</label>
  <select
    name="role"
    value={RoleFilter}
    onChange={handleRoleChange}
    className="w-full px-4 py-3 mt-2 rounded-lg bg-white border-2 border-gradient-to-r from-indigo-600 to-purple-600 
      hover:border-gradient-to-r hover:from-pink-500 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-400 
      transition duration-300 ease-in-out"
  >
    <option value="All">All</option>
    <option value="Permanent">Permanent</option>
    <option value="Temporary">Temporary</option>
    <option value="Dailywages">Daily Wages</option>
  </select>
</div>
<div className="mb-6">
  <label htmlFor="date" className="text-lg font-semibold text-gray-700">Date</label>
  <input
    type="date"
    name="date"
    value={filterDate ? convertToYYYYMMDD(filterDate) : ""}  
    onChange={handleFilterChange}
    className="w-full px-4 py-3 mt-2 rounded-lg bg-white border-2 border-gradient-to-r from-indigo-600 to-purple-600 
      hover:border-gradient-to-r hover:from-pink-500 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-400 
      transition duration-300 ease-in-out"
    disabled={monthlyFilter}
  />
</div>
<div className="mb-6 flex items-center gap-3">
  <input
    type="checkbox"
    checked={monthlyFilter}
    onChange={handleMonthlyFilter}
    id="monthlyFilter"
    className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
  />
  <label htmlFor="monthlyFilter" className="text-lg font-semibold text-gray-700">Monthly Filter</label>
</div>



{/* Display Attendance Data Table */}
{monthlyAttendance.length > 0 ? (
  <table className="min-w-full bg-white border border-gray-300">
    <thead>
      <tr>
        <th className="px-4 py-2 border-b">Name</th>
        <th className="px-4 py-2 border-b">Contact</th>
        <th className="px-4 py-2 border-b">Status</th>
        <th className="px-4 py-2 border-b">Date</th>
      </tr>
    </thead>
    <tbody>
      {monthlyAttendance.map((employee, index) => (
        <tr key={index}>
          <td className="px-4 py-2 border-b">{employee.name}</td>
          <td className="px-4 py-2 border-b">{employee.contact}</td>
          <td className="px-4 py-2 border-b">{employee.status}</td>
          <td className="px-4 py-2 border-b">{employee.date}</td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <p></p>
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
            <p><strong>Role:</strong> {selectedEmployee.role}</p>
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
