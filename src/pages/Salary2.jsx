import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";

const db = getFirestore();
const auth = getAuth();

const SalaryApp = (  updateSalaryStatus) => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]); // To store attendance data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSalary, setNewSalary] = useState({
    employeeId: "",
    date: "",  // Using the "date" input for calendar
    basicSalary: "",
    bonuses: "",
    deductions: "",
    netSalary: "",
    status: "Paid",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");

  // New state variables for Role and Attendance Counts
  const [role, setRole] = useState("");
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);

  // Info Box States
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalAbsent, setTotalAbsent] = useState(0);
  const [totalOnLeave, setTotalOnLeave] = useState(0);
  const [overallAttendancePercentage, setOverallAttendancePercentage] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [salary, setSalary] = useState(0);
  useEffect(() => {
    const fetchUserAndEmployees = async () => {
      try {
        const currentUser = auth.currentUser;
  
        if (!currentUser) {
          console.error("No user is logged in.");
          return;
        }
  
        setUser(currentUser);
  
        // Fetch employee details
        const employeeQuery = query(
          collection(db, "admins", currentUser.email, "Empdetails")
        );
        const employeeSnapshot = await getDocs(employeeQuery);
        const fetchedEmployees = employeeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(fetchedEmployees);
        setTotalEmployees(fetchedEmployees.length);
  
        // Fetch salary data
        const salaryCollectionRef = collection(
          db,
          "admins",
          currentUser.email,
          "salary"
        );
        const salarySnapshot = await getDocs(salaryCollectionRef);
        const fetchedSalaries = salarySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSalaries(fetchedSalaries);
  
        // Fetch attendance data
        const attendanceCollectionRef = collection(
          db,
          "admins",
          currentUser.email,
          "attendance"
        );
        const attendanceSnapshot = await getDocs(attendanceCollectionRef);
        const fetchedAttendances = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAttendances(fetchedAttendances);
  
        // Calculate attendance data
        calculateAttendanceData(fetchedSalaries, fetchedAttendances);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchUserAndEmployees();
  }, []);
  
  // Calculate total attendance stats
  const calculateAttendanceData = (salaries, attendances) => {
    const present = attendances.filter((att) => att.status === "Present").length;
    const absent = attendances.filter((att) => att.status === "Absent").length;
    const onLeave = attendances.filter((att) => att.status === "On Leave").length;

    setTotalPresent(present);
    setTotalAbsent(absent);
    setTotalOnLeave(onLeave);

    const attendancePercentage = totalEmployees
      ? ((present / totalEmployees) * 100).toFixed(2)
      : 0;
    setOverallAttendancePercentage(attendancePercentage);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSalary((prev) => {
      const updatedSalary = { ...prev, [name]: value };
      if (name === "basicSalary" || name === "bonuses" || name === "deductions") {
        // Calculate net salary automatically
        updatedSalary.netSalary = (
          parseFloat(updatedSalary.basicSalary || 0) +
          parseFloat(updatedSalary.bonuses || 0) - 
          parseFloat(updatedSalary.deductions || 0)
        ).toFixed(2);
      }
      return updatedSalary;
    });
  };

  const handleEmployeeChange = (e) => {
    const selectedEmployeeId = e.target.value;
    setNewSalary((prev) => ({ ...prev, employeeId: selectedEmployeeId }));
    // Fetch role and attendance counts when an employee is selected
    const employee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (employee) {
      setRole(employee.role);
      calculateAttendanceCounts(selectedEmployeeId);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    // Validation: Ensure required fields are provided
    if (!newSalary.employeeId || !newSalary.date || !newSalary.basicSalary) {
      Swal.fire({
        title: "Error!",
        text: "Please fill in all required fields (Employee, Date, Basic Salary).",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
  
    if (!user) {
      Swal.fire({
        title: "Error!",
        text: "Please log in to add or update salary details.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }
  
    try {
      const salaryData = {
        ...newSalary,
        employeeId: newSalary.employeeId,
      };
  
      // Reference to the salary collection for the logged-in admin
      const salaryCollectionRef = collection(
        db,
        "admins",
        user.email,
        "salary"
      );
  
      if (newSalary.id) {
        // Update existing salary record
        const salaryDocRef = doc(salaryCollectionRef, newSalary.id);
        await updateDoc(salaryDocRef, salaryData);
  
        // Update the state
        setSalaries((prev) =>
          prev.map((sal) =>
            sal.id === newSalary.id ? { ...sal, ...salaryData } : sal
          )
        );
  
        Swal.fire({
          title: "Updated!",
          text: "Salary updated successfully!",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      } else {
        // Add new salary record
        const newDocRef = await addDoc(salaryCollectionRef, salaryData);
  
        // Update the state
        setSalaries((prev) => [
          ...prev,
          { id: newDocRef.id, ...salaryData },
        ]);
  
        Swal.fire({
          title: "Added!",
          text: "Salary added successfully!",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      }
  
      // Reset the form and close modal
      setIsModalOpen(false);
      setNewSalary({
        employeeId: "",
        date: "", // Clear the date
        basicSalary: "",
        bonuses: "",
        deductions: "",
        netSalary: "",
        status: "Paid",
      });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error adding/updating salary:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to add/update salary. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };
  const [salaryDate, setSalaryDate] = useState("");
  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);

    if (date) {
      await fetchAttendance(date);
    }
  };
  const handleDateChangee = (e) => {
    setSalaryDate(e.target.value);
  };
  const handleEdit = (salaryId) => {
    const salary = salaries.find((sal) => sal.id === salaryId);
    setNewSalary(salary);
    setIsEditMode(true); // Set to edit mode
    setIsModalOpen(true); // Open modal for editing
    // Fetch employee role and calculate attendance counts when editing
    const employee = employees.find((emp) => emp.id === salary.employeeId);
    if (employee) {
      setRole(employee.role);
      calculateAttendanceCounts(employee.id);
    }
  };
  
  const handleDelete = async (salaryId) => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please log in to delete salary records.",
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
        // Correct Firestore path for salary document
        const salaryDocRef = doc(
          db,
          "admins",
          user.email,
          "salary",
          salaryId
        );
  
        // Delete the document from Firestore
        await deleteDoc(salaryDocRef);
  
        // Update the local state
        setSalaries((prev) => prev.filter((sal) => sal.id !== salaryId));
  
        // Show success notification
        Swal.fire({
          title: "Deleted!",
          text: "The salary record has been deleted.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      } catch (error) {
        console.error("Error deleting salary:", error);
  
        // Show error notification
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: "Failed to delete salary. Please try again.",
        });
      }
    }
  };
  const [selectedSalaryDate, setSelectedSalaryDate] = useState(new Date());
  const [viewEmployee, setViewEmployee] = useState(null);
  const [attendanceCounts, setAttendanceCounts] = useState({
    absentCount: 0,
    presentCount: 0,
    totalWorkingDays: 0,
  });
  const handleStatusClick = (employeeId) => {
    const updatedStatus = viewEmployee.status === "Paid" ? "Pending" : "Paid";
    updateSalaryStatus(employeeId, updatedStatus);
  };
  const calculateAttendanceCounts = (employeeId) => {
    const employeeAttendance = attendances.filter(
      (att) => att.employeeId === employeeId
    );

    const presentCount = employeeAttendance.filter((att) => att.status === "Present").length;
    const absentCount = employeeAttendance.filter((att) => att.status === "Absent").length;

    setPresentCount(presentCount);
    setAbsentCount(absentCount);
  };
  
  
  // Combine Employee and Salary Data
  const employeeSalaryData = salaries.map((salary) => {
    const employee = employees.find((emp) => emp.id === salary.employeeId);
    const employeeAttendance = attendances.filter(
      (att) => att.employeeId === salary.employeeId
    );

    const presentCount = employeeAttendance.filter((att) => att.status === "Present").length;
    const absentCount = employeeAttendance.filter((att) => att.status === "Absent").length;

    return {
      ...salary,
      employeeName: employee ? employee.name : "Unknown",
      employeeRole: employee ? employee.role : "N/A", // Assuming role is stored in employee data
      presentCount,
      absentCount,
    };
  });
  const fetchAttendance = async (date) => {
    const attendanceRef = collection(db, "admins", "mathu@gmail.com", "attendance"); // Change the user email accordingly
    const attendanceQuery = query(attendanceRef, where("date", "==", date));
    
    const querySnapshot = await getDocs(attendanceQuery);
    let absentCount = 0;
    let presentCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === "Present") {
        presentCount += 1;
      } else if (data.status === "Absent") {
        absentCount += 1;
      }
    });

    const totalWorkingDays = presentCount + absentCount; // Assuming total working days is sum of present and absent days.

    setAttendanceCounts({ absentCount, presentCount, totalWorkingDays });

    // Calculate salary based on present count and salary interval
    if (viewEmployee) {
      const calculatedSalary =
        viewEmployee.salaryInterval === "monthly"
          ? (presentCount * viewEmployee.salary) / totalWorkingDays
          : presentCount * viewEmployee.salary;
      setSalary(calculatedSalary);
    }
  };

  const handleViewEmployee = async (employee) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2025-01"

    // Fetch attendance counts for the employee
    const counts = await fetchMonthlyAttendance(employee.name, currentMonth);

    // Set employee data and calculated attendance counts
    setAttendanceCounts({
      absentCount: counts.absentCount,
      presentCount: counts.presentCount,
      totalWorkingDays: counts.absentCount + counts.presentCount,
    });

    setViewEmployee(employee);
  };
  // Filter Logic
  const filteredSalaryData = employeeSalaryData.filter((salary) => {
    const matchesEmployee = employeeFilter
      ? salary.employeeName.toLowerCase().includes(employeeFilter.toLowerCase())
      : true;

    const matchesStatus = statusFilter ? salary.status === statusFilter : true;

    const matchesDate =
      dateFilterStart && dateFilterEnd
        ? new Date(salary.date) >= new Date(dateFilterStart) &&
          new Date(salary.date) <= new Date(dateFilterEnd)
        : true;

    return matchesEmployee && matchesStatus && matchesDate;
  });

  const handleResetFilters = () => {
    setEmployeeFilter("");
    setStatusFilter("");
    setDateFilterStart("");
    setDateFilterEnd("");
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Info Box Section */}
      <div className="flex space-x-6 mb-6">
        <div className="bg-gradient-to-r from-blue-700 to-blue-700 p-6 rounded-lg shadow-lg text-center text-white w-80">
          <h3 className="text-xl font-semibold">Total Employees</h3>
          <p className="text-4xl font-bold">{totalEmployees}</p>
        </div>

        <div className="bg-gradient-to-r from-purple-900 to-purple-900 p-6 rounded-lg shadow-lg text-center text-white w-80">
          <h3 className="text-xl font-semibold">Total Present</h3>
          <p className="text-4xl font-bold">{totalPresent}</p>
        </div>

        <div className="bg-gradient-to-r from-orange-900 to-orange-900 p-6 rounded-lg shadow-lg text-center text-white w-80">
          <h3 className="text-xl font-semibold">Total Absent</h3>
          <p className="text-4xl font-bold">{totalAbsent}</p>
        </div>

        <div className="bg-gradient-to-r from-green-900 to-green-900 p-6 rounded-lg shadow-lg text-center text-white w-80">
          <h3 className="text-xl font-semibold">Overall Attendance (%)</h3>
          <p className="text-4xl font-bold">{overallAttendancePercentage}%</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-blue-900 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Filter by Employee
            </label>
            <input
              type="text"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              placeholder="Search Employee..."
              className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Filter by Status
            </label>
            <select
              className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Filter by Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilterStart}
                onChange={(e) => setDateFilterStart(e.target.value)}
                className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700"
              />
              <input
                type="date"
                value={dateFilterEnd}
                onChange={(e) => setDateFilterEnd(e.target.value)}
                className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center items-center">
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 w-half sm:w-auto"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Add New Salary Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-900 to-blue-900 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-900 to-blue-900"
        >
          Add New Salary
        </button>
      </div>

      <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200 mt-6 p-4">
      <h2 className="text-xl font-semibold mb-4">Salary Table</h2>
      <table className="min-w-full table-auto">
        <thead className="bg-gradient-to-r from-blue-900 to-blue-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left">Employee Name</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Salary Date</th>
            <th className="px-4 py-3 text-left">Net Salary</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-3 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-4 text-red-500 font-semibold">
                No Salary Records Found
              </td>
            </tr>
          ) : (
            employees.map((employee) => (
              <tr key={employee.id} className="border-b hover:bg-gray-100">
                <td className="px-6 py-2">{employee.name}</td>
                <td className="px-4 py-2">{employee.role}</td>
                <td className="px-4 py-2">
                <input
                  type="date"
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={salaryDate}
                  onChange={handleDateChangee}
                />
                </td>
                <td className="px-4 py-2">
  ${employee.salary} ({employee.salaryInterval})
</td>

                <td className="px-4 py-2">
                  <button
                    onClick={() => handleStatusClick(employee.id)}
                    className={`px-4 py-1 rounded-lg ${
                      employee.status === "Paid"
                        ? "bg-green-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {employee.status}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setViewEmployee(employee)}
                    className="text-blue-500 hover:text-blue-700 p-2 rounded-full transition duration-200"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {viewEmployee && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full">
          <input
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        className="border p-2 rounded"
      />
            <h3 className="text-xl font-semibold mb-4">{viewEmployee.name}'s Details</h3>
            <p>
              <strong>Contact:</strong> {viewEmployee.contact}
            </p>
            <p>
              <strong>Role:</strong> {viewEmployee.role}
            </p>
            <p>
              <strong>Absent Count:</strong> {attendanceCounts.absentCount || 0}
            </p>
            <p>
              <strong>Present Count:</strong> {attendanceCounts.presentCount || 0}
            </p>
            <p>
              <strong>Total Working Days:</strong> {attendanceCounts.totalWorkingDays || 0}
            </p>
            <p>
              <strong>Salary:</strong> $
              {viewEmployee.salaryInterval === "monthly"
                ? (attendanceCounts.presentCount * viewEmployee.salary) / attendanceCounts.totalWorkingDays
                : attendanceCounts.presentCount * viewEmployee.salary}
            </p>
            <button
              onClick={() => setViewEmployee(null)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
</div>
      {/* Modal to Add or Edit Salary */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
          <div className="bg-blue-900 p-5 rounded-xl shadow-lg w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100">
                {isEditMode ? "Update Salary" : "Add Salary"}
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
                    value={newSalary.employeeId}
                    onChange={handleEmployeeChange}
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

                {/* Role Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    readOnly
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Present Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Present Count
                  </label>
                  <input
                    type="number"
                    value={presentCount}
                    readOnly
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Absent Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Absent Count
                  </label>
                  <input
                    type="number"
                    value={absentCount}
                    readOnly
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Salary Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Salary Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newSalary.date}
                    onChange={handleInputChange}
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Basic Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Basic Salary
                  </label>
                  <input
                    type="number"
                    name="basicSalary"
                    value={newSalary.basicSalary}
                    onChange={handleInputChange}
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Bonuses */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Bonuses
                  </label>
                  <input
                    type="number"
                    name="bonuses"
                    value={newSalary.bonuses}
                    onChange={handleInputChange}
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Deductions */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Deductions
                  </label>
                  <input
                    type="number"
                    name="deductions"
                    value={newSalary.deductions}
                    onChange={handleInputChange}
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Net Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Net Salary
                  </label>
                  <input
                    type="number"
                    name="netSalary"
                    value={newSalary.netSalary}
                    onChange={handleInputChange}
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Salary Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-100">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newSalary.status}
                    onChange={handleInputChange}
                    className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
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
                  {isEditMode ? "Update Salary" : "Add Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryApp;
