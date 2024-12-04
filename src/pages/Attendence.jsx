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
  
  // const filterAttendance = async (value, isMonth) => {
  //   console.log("Filtering data for:", value, "Is Month Filter?", isMonth);
  
  //   try {
  //     let queryDate = value;
  
  //     // If it's a month filter (yyyy-MM), we need to transform it into MM.yyyy format
  //     if (isMonth) {
  //       // Ensure value is in 'yyyy-MM' format, like '2024-12'
  //       const [year, month] = value.split('-'); // Split the value to extract year and month
  //       queryDate = `${month}.${year}`; // Format to 'MM.yyyy' (e.g., '12.2024')
  //     }
  
  //     console.log("Querying attendance for:", queryDate);
  
  //     // Query the attendance for the selected date
  //     const attendanceRef = doc(db, "admins", currentUser.email, "attendance", queryDate);
  //     const docSnapshot = await getDoc(attendanceRef);
  
  //     if (docSnapshot.exists()) {
  //       const data = docSnapshot.data().employees;
  //       console.log("Fetched Data:", data);
  
  //       // Update the employee status based on the attendance data
  //       const updatedData = data.map((employee) => {
  //         return {
  //           ...employee,
  //           attendance: employee.status,  
  //         };
  //       });
  
  //       setFilteredEmployees(updatedData); // Update the filtered employees
  //     } else {
  //       console.log("No data found for the selected date.");
  //       setFilteredEmployees([]); // Clear the filtered data if no attendance found
  //     }
  //   } catch (error) {
  //     console.error("Error fetching attendance:", error);
  //   }
  // };
  
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
  
      const attendanceRef = doc(db, "admins", currentUser.email, "attendance", formattedDate);
      await setDoc(attendanceRef, { employees: attendanceData });
  
      // Show success alert using SweetAlert
      Swal.fire({
        icon: 'success',
        title: 'Attendance saved successfully!',
        text: `Attendance for ${formattedMonthYear} has been saved.`,
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error("Error saving attendance:", error);
  
      // Show error alert using SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'There was an error saving the attendance. Please try again.',
        confirmButtonText: 'OK',
      });
    }
  };
  
  const handleFilterChange = (e) => {
    const selectedValue = e.target.value;
  
    console.log("Selected Value:", selectedValue); // Debugging log
  
    if (selectedValue === "All") {
      // Show all employees for the current selected date or month
      setStatusFilter("All");
      if (filterDate) {
        filterAttendance(filterDate, monthlyFilter); // Reapply current date/month filter
      } else {
        setFilteredEmployees(employees); // Show all employees
      }
    } else if (selectedValue === "Present" || selectedValue === "Absent") {
      // Filter based on attendance status (Present/Absent) for the current date or month
      setStatusFilter(selectedValue);
  
      if (filterDate) {
        // Apply both status and date/month filter
        filterAttendance(filterDate, monthlyFilter, selectedValue);
      } else {
        // Default to showing all employees filtered by status
        const filteredByStatus = employees.filter((employee) => employee.attendance === selectedValue);
        setFilteredEmployees(filteredByStatus);
      }
    } else if (e.target.type === "date") {
      // Handle specific date selection
      const formattedDate = convertToDDMMYYYY(selectedValue);
      setFilterDate(formattedDate); // Update state with the selected date
      filterAttendance(formattedDate, false); // Exact date filter
    } else if (e.target.type === "month") {
      // Handle month selection
      const formattedMonth = selectedValue.replace("-", ".");
      setFilterDate(formattedMonth); // Update state with the selected month
      filterAttendance(formattedMonth, true); // Monthly filter
    }
  };
  
  const handleMonthlyFilter = (e) => {
    const isChecked = e.target.checked;
    setMonthlyFilter(isChecked); // Toggle the monthly filter visibility
  
    if (isChecked && filterDate) {
      // Apply month filter
      filterAttendance(filterDate, true); // Pass 'true' to indicate a monthly filter
    } else if (!isChecked) {
      // Show data based on the last selected date
      if (filterDate) {
        filterAttendance(filterDate, false); // Pass 'false' for exact date filter
      } else {
        setFilteredEmployees(employees); // Reset to show all employees
      }
    }
  };
  const filterAttendance = async (value, isMonth, statusFilter = null) => {
    console.log("Filtering data for:", value, "Is Month Filter?", isMonth);

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

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

  const convertToFirestoreDate = (date) => {
    const [day, month, year] = date.split(".");
    return `${year}-${month}-${day}`; // Convert 'dd.mm.yyyy' to 'yyyy-mm-dd'
  };
  
  const convertToDisplayDate = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`; // Convert 'yyyy-mm-dd' to 'dd.mm.yyyy'
  };
  const convertToDDMMYYYY = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
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

{/* Date Filter */}
<div className="mb-6">
  <label htmlFor="date" className="text-lg font-semibold text-gray-700">Date</label>
  <input
    type="date"
    name="date"
    value={filterDate}  
    onChange={handleFilterChange}
    className="w-full px-4 py-3 mt-2 rounded-lg bg-white border-2 border-gradient-to-r from-indigo-600 to-purple-600 
      hover:border-gradient-to-r hover:from-pink-500 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-400 
      transition duration-300 ease-in-out"
    disabled={monthlyFilter}  // Disable date picker if monthly filter is active
  />
</div>


{/* Monthly Filter */}
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

{/* Show month selector only if monthly filter is checked */}
{monthlyFilter && (
  <div className="mb-6">
    <label htmlFor="month" className="text-lg font-semibold text-gray-700">Select Month</label>
    <input
      type="month"
      name="month"
      value={filterDate}
      onChange={handleFilterChange} // Use the same function for both date and month handling
      className="w-full px-4 py-3 mt-2 rounded-lg bg-white border-2 border-gradient-to-r from-indigo-600 to-purple-600 
        hover:border-gradient-to-r hover:from-pink-500 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-400 
        transition duration-300 ease-in-out"
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
