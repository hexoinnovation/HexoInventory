import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,setDoc,getDoc,orderBy,where,limit
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import { writeBatch } from 'firebase/firestore';

const db = getFirestore();
const auth = getAuth();

const AttendanceApp = (currentUser) => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]); // Fetch employee details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAttendance, setNewAttendance] = useState({
    employeeName: "",
        employeeContact:"",
        employeeEmail:"",
        date: "",
        status: "Present",
  });
  const [employee, setEmployee] = useState([]);
  const [viewAttendance, setViewAttendance] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState(""); // Status filter (Present, Absent, On Leave)
  const [employeeFilter, setEmployeeFilter] = useState(""); // Employee filter (employee name)
  const [dateFilterStart, setDateFilterStart] = useState(""); // Start date filter
  const [dateFilterEnd, setDateFilterEnd] = useState(""); // End date filter
  const [latestDate, setLatestDate] = useState(new Date().toISOString().substr(0, 10)); // Default to today
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [latestAttendance, setLatestAttendance] = useState(null);
  //const [formattedEmployees, setformatted] = useState(null);
  //const formattedDate = new Date(employee.date).toISOString().split('T')[0];  // Formats to 'yyyy-mm-dd'

  useEffect(() => {
    const fetchAttendanceAndEmployees = async () => {
      try {
        const currentUser = auth.currentUser;
        setUser(currentUser);
  
        if (currentUser) {
          const employeeQuery = collection(db, "admins", currentUser.email, "Empdetails");
          const employeeSnapshot = await getDocs(employeeQuery);
          let fetchedEmployees = [];
          if (!employeeSnapshot.empty) {
            fetchedEmployees = employeeSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
          }
  
          const attendanceQuery = collection(db, "admins", currentUser.email, "attendance");
          const attendanceSnapshot = await getDocs(attendanceQuery);
          let latestAttendance = [];
          if (!attendanceSnapshot.empty) {
            const allAttendance = attendanceSnapshot.docs.map((doc) => ({
              id: doc.id,
              records: doc.data(),
            }));
  
            const sortedAttendance = allAttendance.sort((a, b) => {
              const dateA = new Date(a.id.replace(/-/g, "/"));
              const dateB = new Date(b.id.replace(/-/g, "/"));
              return dateB - dateA; // Descending order
            });
  
            latestAttendance = Object.keys(sortedAttendance[0].records || {}).map((key) => {
              const record = sortedAttendance[0].records[key];
              return {
                id: key,
                name: record.name || "N/A",
                contact: record.contact || "N/A",
                email: record.email || "N/A",
                date: record.date || sortedAttendance[0].id,
                timeIn: record.timeIn || "",
                timeOut: record.timeOut || "",
                status: record.status || "Unknown",
              };
            });
          }
  
          // Combine fetched employees with attendance data
          const combinedData = fetchedEmployees.map((employee) => {
            const attendanceRecord = latestAttendance.find((record) => record.id === employee.id) || {};
            return { ...employee, ...attendanceRecord };
          });
  
          setAttendanceRecords(combinedData);
        } else {
          console.log("User not authenticated.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch data. Please try again.",
        });
      }
    };
  
    fetchAttendanceAndEmployees();
  }, []);
  

  const isValidDate = (date) => {
    // If date is a string, ensure it's in a format that can be parsed by Date constructor
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  };
  
  const handleDateChange = (e, employeeId) => {
    const newDate = e.target.value;
    setEmployees((prevEmployees) =>
      prevEmployees.map((emp) =>
        emp.id === employeeId ? { ...emp, date: newDate } : emp
      )
    );
  };
  
  const handleTimeChange = (employeeId, timeType, newTime) => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((employee) =>
        employee.id === employeeId ? { ...employee, [timeType]: newTime } : employee
      )
    );
  };
  
  const handleStatusChange = (employeeId, newStatus) => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((employee) =>
        employee.id === employeeId ? { ...employee, status: newStatus } : employee
      )
    );
  };
  const handleDateChangee = (e, employeeId) => {
    const newDate = e.target.value;
    setAttendanceRecords((prevRecords) =>
      prevRecords.map((emp) =>
        emp.id === employeeId ? { ...emp, date: newDate } : emp
      )
    );
  };
  
  const handleTimeChangee = (employeeId, timeType, newTime) => {
    setAttendanceRecords((prevRecords) =>
      prevRecords.map((employee) =>
        employee.id === employeeId ? { ...employee, [timeType]: newTime } : employee
      )
    );
  };
  
  const handleStatusChangee = (employeeId, newStatus) => {
    setAttendanceRecords((prevRecords) =>
      prevRecords.map((employee) =>
        employee.id === employeeId ? { ...employee, status: newStatus } : employee
      )
    );
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAttendance((prev) => ({ ...prev, [name]: value }));
  };
  const handleSaveAttendance = async () => {
    if (!user) {
        console.log("No user is logged in.");
        return;
    }

    const attendanceRef = collection(db, "admins", user.email, "attendance");

    try {
        const attendanceData = {};

        // Iterate over attendanceRecords to prepare data for saving
        for (const employee of attendanceRecords) {
            // Ensure employee data contains a valid date
            if (!employee.date) {
                console.log(`Date is missing for employee: ${employee.name}. Please select a date.`);
                Swal.fire({
                    icon: "error",
                    title: "Missing Date",
                    text: `Please select a date for ${employee.name}.`,
                });
                return;
            }

            // Format the date
            const formattedDate = employee.date;

            if (!attendanceData[formattedDate]) {
                attendanceData[formattedDate] = {};
            }

            // Save the attendance record including the date
            attendanceData[formattedDate][employee.id] = {
                name: employee.name,
                contact: employee.contact || "N/A",
                email: employee.email || "N/A",
                date: formattedDate,  // Save the formatted date
                timeIn: employee.timeIn || "00:00",
                timeOut: employee.timeOut || "00:00",
                status: employee.status || "Absent",
            };
        }

        // Save all attendance records to Firestore
        for (const date in attendanceData) {
            const attendanceDocRef = doc(attendanceRef, date);
            await setDoc(attendanceDocRef, attendanceData[date], { merge: true });

            console.log(`Attendance for date ${date} saved successfully!`);
        }

        Swal.fire({
            icon: "success",
            title: "Success",
            text: "Attendance saved successfully!",
        });

    } catch (error) {
        console.error("Error saving attendance: ", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to save attendance. Please try again.",
        });
    }
};


  //   const attendance = attendances.find((att) => att.id === attendanceId);
  //   setNewAttendance(attendance);
  //   setIsEditMode(true); // Set to edit mode
  //   setIsModalOpen(true); // Open the modal for editing
  // };

  // const handleView = (attendanceId) => {
  //   const attendance = attendances.find((att) => att.id === attendanceId);
  //   setViewAttendance(attendance);
  // };

  // const handleDelete = async (attendanceId) => {
  //   if (!user) {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Oops...",
  //       text: "Please log in to delete attendance records.",
  //     });
  //     return;
  //   }
  
  //   const result = await Swal.fire({
  //     title: "Are you sure?",
  //     text: "You won't be able to revert this!",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#3085d6",
  //     cancelButtonColor: "#d33",
  //     confirmButtonText: "Yes, delete it!",
  //     cancelButtonText: "Cancel",
  //   });
  
  //   if (result.isConfirmed) {
  //     try {
  //       // Reference the specific document to delete
  //       const attendanceDocRef = doc(
  //         db,
  //         "admins",
  //         user.email,
  //         "attendance",
  //         attendanceId
  //       );
  
  //       // Delete the document
  //       await deleteDoc(attendanceDocRef);
  
  //       // Update the state to remove the deleted attendance
  //       setAttendances((prev) => prev.filter((att) => att.id !== attendanceId));
  
  //       Swal.fire({
  //         title: "Deleted!",
  //         text: "The attendance record has been deleted.",
  //         icon: "success",
  //         showConfirmButton: false,
  //         timer: 2000,
  //       });
  //     } catch (error) {
  //       console.error("Error deleting attendance:", error);
  //       Swal.fire({
  //         icon: "error",
  //         title: "Failed!",
  //         text: "Failed to delete attendance. Please try again.",
  //       });
  //     }
  //   }
  // };
  
  // Combine Employee and Attendance Data
  const employeeAttendanceData = attendances.map((attendance) => {
    const employee = employees.find((emp) => emp.id === attendance.employeeId);
    return {
      ...attendance,
      employeeName: employee ? employee.name : "employeeName",
      employeeContact: employee ? employee.contact : "employeeContact/A",
      employeeEmail: employee ? employee.email : "employeeEmail",
    };
  });

  // Filter Logic
  const filteredAttendanceData = employeeAttendanceData.filter((attendance) => {
    // Filter by employee name
    const matchesEmployee = employeeFilter
      ? attendance.employeeName
          .toLowerCase()
          .includes(employeeFilter.toLowerCase())
      : true;

    // Filter by status
    const matchesStatus = statusFilter
      ? attendance.status === statusFilter
      : true;

    // Filter by date range
    const matchesDate =
      dateFilterStart && dateFilterEnd
        ? new Date(attendance.date) >= new Date(dateFilterStart) &&
          new Date(attendance.date) <= new Date(dateFilterEnd)
        : true;

    return matchesEmployee && matchesStatus && matchesDate;
  });

  const totalEmployees = employees.length;
  const totalPresent = employees.filter((employee) => employee.status === "Present").length;
  const totalAbsent = employees.filter((employee) => employee.status === "Absent").length;
  const totalOnLeave = employees.filter((employee) => employee.status === "On Leave").length;
  const overallAttendancePercentage = totalEmployees > 0 
    ? ((totalPresent / totalEmployees) * 100).toFixed(2) 
    : 0;
  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Info Box Section */}
      <div className="flex space-x-6 mb-6">
        {/* Total Employees Info Box */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total Employees</h3>
          <p className="text-4xl font-bold">{totalEmployees}</p>
        </div>

        {/* Total Present Info Box */}
        <div className="bg-gradient-to-r from-indigo-400 to-purple-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total Present</h3>
          <p className="text-4xl font-bold">{totalPresent}</p>
        </div>

        {/* Total Absent Info Box */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total Absent</h3>
          <p className="text-4xl font-bold">{totalAbsent}</p>
        </div>

        {/* Total On Leave Info Box */}
        <div className="bg-gradient-to-r from-pink-400 to-red-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total On Leave</h3>
          <p className="text-4xl font-bold">{totalOnLeave}</p>
        </div>

        {/* Overall Attendance Percentage Info Box */}
        <div className="bg-gradient-to-r from-teal-400 to-green-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Overall Attendance (%)</h3>
          <p className="text-4xl font-bold">{overallAttendancePercentage}%</p>
        </div>
      </div>
{/* Filter Section */}
<div className="bg-blue-900 p-4 rounded-md shadow-md mb-6">
  <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
  <div className="grid grid-cols-4 gap-6">
    {/* Filter by Employee Name */}
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-100 mb-2">
        Filter by Employee
      </label>
      <input
        type="text"
        value={employeeFilter}
        onChange={(e) => setEmployeeFilter(e.target.value)}
        placeholder="Search Employee..."
        className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
      />
    </div>

    {/* Filter by Status */}
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-100 mb-2">
        Filter by Status
      </label>
      <select
        className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="Present">Present</option>
        <option value="Absent">Absent</option>
        <option value="On Leave">On Leave</option>
      </select>
    </div>

    {/* Filter by Date Range */}
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-100 mb-2">
        Filter by Date
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={dateFilterStart}
          onChange={(e) => setDateFilterStart(e.target.value)}
          className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
        />
        <input
          type="date"
          value={dateFilterEnd}
          onChange={(e) => setDateFilterEnd(e.target.value)}
          className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
        />
      </div>
    </div>

    {/* Reset Button */}
    <div className="flex flex-col justify-center items-center">
      <button
        type="button"
        onClick={() => {
          // Reset all filters
          setEmployeeFilter("");
          setStatusFilter("");
          setDateFilterStart("");
          setDateFilterEnd("");
        }}
        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 w-half sm:w-auto md:w-auto lg:w-auto mt-6"
      >
        Reset Filter
      </button>
    </div>
  </div>
</div>

      {/* Add New Attendance Button */}
      <div className="mb-6">
        {/* <button
          onClick={() => setIsModalOpen(true)} // Open modal to add new attendance
          className="bg-gradient-to-r from-blue-900 to-blue-900 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-600"
        >
          Add New Attendance
        </button> */}
      </div>

      {/* Employee and Attendance Table Section */}
      <div className="container mx-auto p-6 bg-blue-100 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-black">Attendance Manager</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-blue-900 text-white text-sm font-bold">
            <tr>
              <th className="px-6 py-4 border border-blue-300 text-left">Employee Name</th>
              <th className="px-6 py-4 border border-blue-300 text-left">Employee Contact</th>
              <th className="px-6 py-4 border border-blue-300 text-left">Employee Email</th>
              <th className="px-6 py-4 border border-blue-300 text-left">Date</th>
              <th className="px-6 py-4 border border-blue-300 text-left">Time In</th>
              <th className="px-6 py-4 border border-blue-300 text-left">Time Out</th>
              <th className="px-6 py-4 border border-blue-300 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="text-black text-sm">
            {attendanceRecords.length === 0 ? (
              // Show employee details input fields if no attendance records
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 border border-blue-300">{employee.name || "N/A"}</td>
                  <td className="px-6 py-4 border border-blue-300">{employee.contact || "N/A"}</td>
                  <td className="px-6 py-4 border border-blue-300">{employee.email || "N/A"}</td>
                  <td className="px-6 py-4 border border-blue-300">
                
  <input
    type="date"
    value={employee.date || ""}
    onChange={(e) => handleDateChange(e, employee.id)}
    className="border border-blue-300 rounded px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</td>

                  <td className="px-6 py-4 border border-blue-300">
  <input
    type="time"
    value={employee.timeIn || ""}
    onChange={(e) =>
      handleTimeChange(employee.id, "timeIn", e.target.value)
    }
    className="border border-blue-300 rounded px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</td>
<td className="px-6 py-4 border border-blue-300">
  <input
    type="time"
    value={employee.timeOut || ""}
    onChange={(e) =>
      handleTimeChange(employee.id, "timeOut", e.target.value)
    }
    className="border border-blue-300 rounded px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</td>
<td className="px-6 py-4 border border-blue-300">
          <select
            value={employee.status || "Present"}
            onChange={(e) => handleStatusChange(employee.id, e.target.value)}
            className="border border-blue-300 rounded px-4 py-2 w-full bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>
        </td>
                </tr>
              ))
            ) : (
              // Show existing attendance records if they exist
              attendanceRecords.map((employee) => (
                <tr key={employee.id} className="hover:bg-blue-200 transition duration-200">
                  <td className="px-6 py-4 border border-blue-300">{employee.name || "N/A"}</td>
                  <td className="px-6 py-4 border border-blue-300">{employee.contact || "N/A"}</td>
                  <td className="px-6 py-4 border border-blue-300">{employee.email || "N/A"}</td>
                
                  <td className="px-6 py-4 border border-blue-300">
  <input
    type="date"
    value={employee.date || ''}
    onChange={(e) => handleDateChangee(e, employee.id)}
    className="border border-blue-300 rounded px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</td>
<td className="px-6 py-4 border border-blue-300">
  <input
    type="time"
    value={employee.timeIn || ''}
    onChange={(e) => handleTimeChangee(employee.id, 'timeIn', e.target.value)}
    className="border border-blue-300 rounded px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</td>
<td className="px-6 py-4 border border-blue-300">
  <input
    type="time"
    value={employee.timeOut || ''}
    onChange={(e) => handleTimeChangee(employee.id, 'timeOut', e.target.value)}
    className="border border-blue-300 rounded px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</td>
<td className="px-6 py-4 border border-blue-300">
  <select
    value={employee.status || 'Present'}
    onChange={(e) => handleStatusChangee(employee.id, e.target.value)}
    className="border border-blue-300 rounded px-4 py-2 w-full bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
  >
    <option value="Present">Present</option>
    <option value="Absent">Absent</option>
    <option value="On Leave">On Leave</option>
  </select>
</td> 
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleSaveAttendance}
        className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-blue-700 transition duration-300 text-lg font-bold"
      >
        Save Attendance
      </button>
    </div>

      {/* View Attendance Modal */}
      {viewAttendance && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-50">
          <div className="bg-blue-900 p-6 rounded-xl shadow-lg w-full max-w-2xl sm:max-w-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100">
                Attendance Details
              </h2>
              <button
                onClick={() => setViewAttendance(null)}
                className="text-red-500 hover:text-blue-500 text-4xl font-bold"
              >
                &times;
              </button>
            </div>
 
            <div className="space-y-6">
              <p className="text-gray-100">
                <strong>Employee:</strong> {viewAttendance.employeeName}
              </p>
              <p className="text-gray-100">
                <strong>Date:</strong> {viewAttendance.date}
              </p>
              <p className="text-gray-100">
                <strong>Status:</strong> {viewAttendance.status}
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewAttendance(null)}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add or Edit Attendance */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
    <div className="bg-blue-900 p-5 rounded-xl shadow-lg w-full max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">
          {isEditMode ? "Edit Attendance" : "Add Attendance"}
        </h2>
        <button
          onClick={() => setIsModalOpen(false)}
          className="text-red-500 hover:text-blue-500 text-4xl font-bold"
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-3 sm:grid-cols-2 gap-6">
          {/* Employee Select */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Employee
            </label>
            <select
              name="employeeId"
              value={newAttendance.employeeId}
              onChange={handleInputChange}
              className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={newAttendance.date}
              onChange={handleInputChange}
              className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Status
            </label>
            <select
              name="status"
              value={newAttendance.status}
              onChange={handleInputChange}
              className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          {/* Time In */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Time In
            </label>
            <input
              type="time"
              name="timeIn"
              value={newAttendance.timeIn}
              onChange={handleInputChange}
              className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Time Out */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Time Out
            </label>
            <input
              type="time"
              name="timeOut"
              value={newAttendance.timeOut}
              onChange={handleInputChange}
              className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Department (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={newAttendance.department}
              onChange={handleInputChange}
              className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter Department"
            />
          </div>

          {/* Reason for Absence (Visible only if Absent) */}
          {newAttendance.status === "Absent" && (
            <div>
              <label className="block text-sm font-medium text-gray-100">
                Reason for Absence
              </label>
              <textarea
                name="reason"
                value={newAttendance.reason}
                onChange={handleInputChange}
                className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter reason for absence"
              />
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-100">
              Comments
            </label>
            <textarea
              name="comments"
              value={newAttendance.comments}
              onChange={handleInputChange}
              className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Additional comments"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            {isEditMode ? "Update Attendance" : "Add Attendance"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

       
    </div>
  );
};

export default AttendanceApp;