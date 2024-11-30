import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { db, auth } from "../config/firebase"; // Assuming Firebase setup is correct
import { collection, query, getDocs, setDoc, doc ,getDoc,updateDoc,serverTimestamp } from "firebase/firestore";
import { format } from "date-fns"; // Install date-fns for date formatting
import Swal from 'sweetalert2';
const Attendance = () => {
  const [employees, setEmployees] = useState([]);

  const [employee, setEmployee] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [monthlyFilter, setMonthlyFilter] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  useEffect(() => {
    const fetchEmployees = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = collection(db, "admins", currentUser.email, "Empdetails");
        const q = query(userDocRef);
        const querySnapshot = await getDocs(q);
        const fetchedEmployees = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(fetchedEmployees);
        setFilteredEmployees(fetchedEmployees); // Ensure this state is defined and used properly
      }
    };
    fetchEmployees();
  }, []);
  // Set the current date
  useEffect(() => {
    const today = new Date();
    const formattedDate = format(today, "dd.MM.yyyy");
    setCurrentDate(formattedDate);

    // Fetch data for the current date
    fetchAttendanceData(formattedDate);
  }, []);

  const handleStatusToggle = async (employeeId, currentStatus) => {
    const updatedEmployees = employees.map((employee) =>
      employee.id === employeeId
        ? { ...employee, status: currentStatus === "Present" ? "Absent" : "Present" }
        : employee
    );
  
    setEmployees(updatedEmployees);
    setFilteredEmployees(updatedEmployees);
  
    // Update Firestore with updated data
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const attendanceRef = doc(db, "admins", currentUser.email, "attendance", currentDate);
        
        // Fetch existing attendance data first
        const docSnapshot = await getDoc(attendanceRef);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
  
          // If data exists, only update the status of the specific employee
          if (data && data.employees) {
            const updatedData = { ...data.employees };
  
            // Update the status of the specific employee
            updatedData[employeeId] = updatedEmployees.find(emp => emp.id === employeeId);
  
            // Save the updated employee status back to Firestore
            await setDoc(attendanceRef, { employees: updatedData }, { merge: true });
          }
        } else {
          console.log("No attendance data found for this date");
        }
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };
  const fetchAttendanceData = async (date) => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const attendanceRef = collection(db, "admins", currentUser.email, "attendance");
        const docRef = doc(attendanceRef, date);

        console.log("Querying Firestore path:", `admins/${currentUser.email}/attendance/${date}`);

        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log("Attendance data fetched: ", data);

            setFilteredEmployees(data.employees || []);
        } else {
            console.log("No attendance data found for this date.");
            setFilteredEmployees([]);
        }
    } catch (error) {
        console.error("Error fetching attendance data: ", error);
    }
};


const saveAttendanceData = async () => {
  const currentUser = auth.currentUser;
  const currentDate = new Date();
  const formattedDate = `${currentDate.getUTCDate()}.${currentDate.getUTCMonth() + 1}.${currentDate.getUTCFullYear()}`;  // Use UTC

  try {
      // Prepare the data to be saved
      const attendanceData = employees.map(employee => {
          // Check for missing fields and handle them
          if (!employee.id || !employee.name || !employee.dob || !employee.contact || !employee.email) {
              console.error('Invalid employee data:', employee);
              return null;  // Skip invalid employees
          }

          return {
              employeeId: employee.id,
              employeeName: employee.name,
              dob: employee.dob,
              contact: employee.contact,
              email: employee.email,
              status: employee.status || "Absent",  // Default to "Absent" if undefined
              photo: employee.photo || "",  // Default to an empty string if undefined
          };
      }).filter(Boolean);  // Remove any invalid entries

      // If there's invalid data, don't proceed
      if (attendanceData.some(data => data === null)) {
          console.error('Some employees have invalid data.');
          return;
      }

      // Create a reference to the 'attendance' subcollection under the user's email in 'admins' collection
      const attendanceRef = collection(db, "admins", currentUser.email, "attendance");

      // Save the attendance data for the current date
      await setDoc(doc(attendanceRef, formattedDate), {
          employees: attendanceData,
      });

      // Success message
      Swal.fire({
          icon: 'success',
          title: 'Attendance Saved!',
          text: 'Your attendance data has been saved successfully.',
          confirmButtonText: 'OK',
      });

      console.log("Attendance data saved successfully!");
  } catch (error) {
      // Error handling
      Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: `Error saving attendance data: ${error.message}`,
          confirmButtonText: 'Try Again',
      });
      console.error("Error saving attendance data: ", error);
  }
};

  const [currentDate, setCurrentDate] = useState("");
  
  const [statusFilter, setStatusFilter] = useState("All");
  const handleMonthlyFilter = (e) => {
    const isChecked = e.target.checked;
    setMonthlyFilter(isChecked);
    if (!isChecked) {
      setFilterDate(''); // Reset the date filter when monthly filter is unchecked
      applyFilter('', false); // Apply filter with no date for all records
    } else {
      applyFilter(filterDate, true); // Apply filter by month
    }
  };

  // Handle date input field change
  const handleFilterChange = (e) => {
    setFilterDate(e.target.value);
    applyFilter(e.target.value, monthlyFilter); // Apply the filter whenever date changes
  };
  const applyFilter = (date, isMonthly) => {
    if (!date) {
        setFilteredEmployees([]);
        return;
    }

    const selectedDate = new Date(date);
    const selectedMonth = selectedDate.getUTCMonth(); // Use UTC to avoid timezone offsets
    const selectedYear = selectedDate.getUTCFullYear();
    const selectedDay = selectedDate.getUTCDate(); // Get UTC day

    const formattedDate = `${selectedDay}.${selectedMonth + 1}.${selectedYear}`;  // Format as DD.MM.YYYY

    console.log("Formatted Date for query:", formattedDate);

    if (!isMonthly) {
        fetchAttendanceData(formattedDate);
    } else {
        // Monthly filter logic
    }
};

  // Show Employee Details Popup
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEmployee(null);
  };
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
 
 // Running clock
 useEffect(() => {
  const timeInterval = setInterval(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, 1000);

  const dateInterval = setInterval(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, 1000);

  return () => {
    clearInterval(timeInterval);
    clearInterval(dateInterval);
  };
}, []);
  return (
    <div>
    <div className="w-full flex flex-col items-start mb-4">
        <h2 className="text-2xl font-semibold text-indigo-600 mb-4 ml-10 mt-5">Attendance for {currentDate}</h2>
        <div className="text-sm font-semibold text-gray-600 ml-10">Current Time: {currentTime}</div>
      </div>
    <div className="container mx-auto p-6 flex gap-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
       
      {/* Employee Table */}
      <div className="w-3/4 bg-white p-4 rounded-lg shadow-lg overflow-x-auto">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">Employee Attendance</h2>
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
                <tr
                  key={employee.id}
                  className="border-b hover:bg-indigo-50 cursor-pointer"
                  onClick={() => handleEmployeeClick(employee)}
                >
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
                        handleStatusToggle(employee.id, employee.status);
                      }}
                      className={`px-4 py-2 rounded-full ${
                        employee.status === "Present" ? "bg-green-500" : "bg-red-500"
                      } text-white`}
                    >
                      {employee.status === "Present" ? (
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
      </div>

      {/* Filter Panel (Right Side) */}
      <div className="w-1/4 bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-indigo-600 mb-4">Filters</h2>
        <div className="mb-4">
          <label htmlFor="status" className="text-sm font-semibold">Status</label>
          <select
            name="status"
            value={filterStatus}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 mt-2 border rounded-lg"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

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
      </div>
  {/* Show date input only when monthly filter is checked */}
  {monthlyFilter && (
        <div className="mb-4">
          <label htmlFor="date" className="text-sm font-semibold">Select Month</label>
          <input
            type="month"
            name="date"
            value={filterDate}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 mt-2 border rounded-lg"
          />
        </div>
      )}

      {/* Employee Detail Modal */}
      {modalVisible && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Employee Details</h3>
              <button onClick={handleCloseModal} className="text-red-500 text-lg">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-4">
              <img
                src={selectedEmployee.photo}
                alt="Employee"
                className="rounded-full w-24 h-24 mx-auto mb-4"
              />
              <div><strong>Name: </strong>{selectedEmployee.name}</div>
              <div><strong>Email: </strong>{selectedEmployee.email}</div>
              <div><strong>Contact: </strong>{selectedEmployee.contact}</div>
              <div><strong>Address: </strong>{selectedEmployee.address}</div>
              <div><strong>Date of Birth: </strong>{selectedEmployee.dob}</div>
              <div><strong>Status: </strong>{selectedEmployee.status}</div>
              <div><strong>Date: </strong>{currentDate}</div>
            </div>
            <div className="flex justify-center">
            {/* <button
                    onClick={() =>
                      handleStatusToggle(employee.id, employee.status)
                    }
                    className={`px-2 py-1 rounded ${
                      employee.status === "Present"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {employee.status}
                  </button> */}
            </div>
          </div>
        </div>
      )}
      
    </div>
    <button
          onClick={saveAttendanceData}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Save Attendance
        </button>
    </div>
  );
};

export default Attendance;