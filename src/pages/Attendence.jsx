import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";

const db = getFirestore();
const auth = getAuth();

const AttendanceApp = () => {
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
  const [viewAttendance, setViewAttendance] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState(""); // Status filter (Present, Absent, On Leave)
  const [employeeFilter, setEmployeeFilter] = useState(""); // Employee filter (employee name)
  const [dateFilterStart, setDateFilterStart] = useState(""); // Start date filter
  const [dateFilterEnd, setDateFilterEnd] = useState(""); // End date filter

  // Fetch user and employee data from Firestore
  useEffect(() => {
    const fetchUserAndEmployees = async () => {
      try {
        const currentUser = auth.currentUser;
        setUser(currentUser);
  
        if (currentUser) {
          // Fetch employee details for assigning attendance
          const employeeQuery = query(
            collection(db, "admins", currentUser.email, "Empdetails")
          );
          const employeeSnapshot = await getDocs(employeeQuery);
          const fetchedEmployees = employeeSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEmployees(fetchedEmployees);
  
          // Fetch attendance records
          const attendanceCollectionRef = collection(
            db,
            "admins",
            currentUser.email,
            "attendance"
          );
          const attendanceSnapshot = await getDocs(attendanceCollectionRef);
          const fetchedAttendances = [];
  
          // Iterate over each attendance document to fetch its subcollections
          for (const doc of attendanceSnapshot.docs) {
            const attendanceDoc = { id: doc.id, ...doc.data() };
  
            // Fetch subcollection (e.g., dynamically named by date)
            const subcollectionQuery = collection(attendanceCollectionRef, doc.id, "<SUBCOLLECTION_NAME>"); // Replace <SUBCOLLECTION_NAME> with actual logic if dynamic
            const subcollectionSnapshot = await getDocs(subcollectionQuery);
  
            // Add subcollection data to the fetched attendance record
            attendanceDoc.subcollectionData = subcollectionSnapshot.docs.map((subDoc) => ({
              id: subDoc.id,
              ...subDoc.data(),
            }));
  
            fetchedAttendances.push(attendanceDoc);
          }
  
          setAttendances(fetchedAttendances);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to fetch attendance and employee details. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    };
  
    fetchUserAndEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAttendance((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      Swal.fire({
        title: "Error!",
        text: "Please log in to add or update attendance details.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const attendanceData = {
        ...newAttendance,
        employeeId: newAttendance.employeeId,
      };

      const userDocRef = collection(db, "admins", user.email, "attendance");

      if (newAttendance.id) {
        const attendanceDocRef = doc(userDocRef, newAttendance.id);
        await updateDoc(attendanceDocRef, attendanceData);
        setAttendances((prev) =>
          prev.map((att) =>
            att.id === newAttendance.id ? { ...att, ...attendanceData } : att
          )
        );
        Swal.fire({
          title: "Updated!",
          text: "Attendance updated successfully!",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        const newDocRef = await addDoc(userDocRef, attendanceData);
        setAttendances((prev) => [
          ...prev,
          { id: newDocRef.id, ...attendanceData },
        ]);
        Swal.fire({
          title: "Added!",
          text: "Attendance added successfully!",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      }

      setIsModalOpen(false);
      setNewAttendance({
        employeeName: "",
        employeeContact:"",
        employeeEmail:"",
        date: "",
        status: "Present",
      });
      setIsEditMode(false); // Reset edit mode
    } catch (error) {
      console.error("Error adding/updating attendance:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to add/update attendance. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleEdit = (attendanceId) => {
    const attendance = attendances.find((att) => att.id === attendanceId);
    setNewAttendance(attendance);
    setIsEditMode(true); // Set to edit mode
    setIsModalOpen(true); // Open the modal for editing
  };

  const handleView = (attendanceId) => {
    const attendance = attendances.find((att) => att.id === attendanceId);
    setViewAttendance(attendance);
  };

  const handleDelete = async (attendanceId) => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please log in to delete attendance records.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const attendanceDocRef = doc(db, "attendance", attendanceId);
        await deleteDoc(attendanceDocRef);
        setAttendances((prev) => prev.filter((att) => att.id !== attendanceId));

        Swal.fire({
          title: "Deleted!",
          text: "The attendance record has been deleted.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      } catch (error) {
        console.error("Error deleting attendance:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: "Failed to delete attendance. Please try again.",
        });
      }
    }
  };

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

  // InfoBox calculations
  const totalEmployees = employees.length;
  const totalPresent = filteredAttendanceData.filter(
    (att) => att.status === "Present"
  ).length;
  const totalAbsent = filteredAttendanceData.filter(
    (att) => att.status === "Absent"
  ).length;
  const totalOnLeave = filteredAttendanceData.filter(
    (att) => att.status === "On Leave"
  ).length;
  const overallAttendancePercentage =
    totalEmployees > 0 ? ((totalPresent / totalEmployees) * 100).toFixed(2) : 0;

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
        <button
          onClick={() => setIsModalOpen(true)} // Open modal to add new attendance
          className="bg-gradient-to-r from-blue-900 to-blue-900 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-600"
        >
          Add New Attendance
        </button>
      </div>

      {/* Employee and Attendance Table Section */}
      <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200 mt-6">
        <table className="min-w-full table-auto mt-4">
          <thead className="bg-gradient-to-r from-blue-900 to-blue-900 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Employee Name</th>
              <th className="px-4 py-2 text-left">Employee Contact</th>
              <th className="px-4 py-2 text-left">Employee Email</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendanceData.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 text-red-500 font-semibold"
                >
                  No Attendance Records Found
                </td>
              </tr>
            ) : (
              filteredAttendanceData.map((attendance) => (
                <tr key={attendance.id} className="border-b">
                  <td className="px-4 py-2">{attendance.employeeName}</td>
                  <td className="px-4 py-2">{attendance.employeeContact}</td>
                  <td className="px-4 py-2">{attendance.employeeEmail}</td>
                  <td className="px-4 py-2">{attendance.date}</td>
                  <td className="px-4 py-2">{attendance.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex space-x-1">
                      <button
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full transition duration-200"
                        onClick={() => handleView(attendance.id)}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full transition duration-200"
                        onClick={() => handleEdit(attendance.id)}
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 p-2 rounded-full transition duration-200"
                        onClick={() => handleDelete(attendance.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
