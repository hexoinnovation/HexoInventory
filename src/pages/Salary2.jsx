import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,where,getDoc,setDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import { EyeIcon } from '@heroicons/react/outline'; // Import the icon
import jsPDF from "jspdf";
import "jspdf-autotable";
import '@fortawesome/fontawesome-free/css/all.min.css';

const db = getFirestore();
const auth = getAuth();

const SalaryApp = (  updateSalaryStatus) => {
  
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState("");
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
  const [salaryData, setSalaryData] = useState([]);
  // Filter States
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [bonus, setBonus] = useState("");
  const [deductions, setDeductions] = useState("");
  const [netSalary, setNetSalary] = useState('');
  useEffect(() => {
    const calculatedNetSalary = basicSalary + bonus - deductions;
    setNetSalary(calculatedNetSalary);
  }, [basicSalary, bonus, deductions]);

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
  const [isMonthly, setIsMonthly] = useState(false); 

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
        setDoc(employeeDocRef, {
          ...attendanceCounts,
          status: status,
          selectedDate: selectedDate,
          salary: viewEmployee.salary, // Add the salary or any other employee-specific details here
          totalWorkingDays: attendanceCounts.totalWorkingDays,
        });
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
  const handleStatusToggle = () => {
    setStatus((prevStatus) => !prevStatus); // Toggle between true (Paid) and false (Pending)
  };
  const handleDateChange = async (event) => {
    const selectedDate = event.target.value;
    setSelectedDate(selectedDate);
  
    if (!selectedDate || !viewEmployee) {
      console.log("Selected date or employee not available.");
      return;
    }
  
    console.log("Selected Date: ", selectedDate);
    console.log("Viewing Employee: ", viewEmployee);
  
    // Extract year and month from the selected date
    const [year, month] = selectedDate.split("-");
    console.log("Year: ", year, "Month: ", month);
  
    try {
      // Calculate start and end dates of the month
      const start = new Date(year, month - 1, 1); // First day of the month
      const end = new Date(year, month, 0); // Last day of the month
  
      console.log(`Fetching attendance for the month from ${start.toISOString()} to ${end.toISOString()}`);
  
      let presentCount = 0;
      let absentCount = 0;
      const attendanceDetails = [];
  
      // Loop through each day in the month
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const formattedDate = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  
        try {
          const docRef = doc(db, "admins", user.email, "attendance", formattedDate);
          const docSnap = await getDoc(docRef);
  
          if (docSnap.exists()) {
            const attendanceData = docSnap.data();
            console.log(`Fetched Attendance for ${formattedDate}:`, attendanceData);
  
            // Check if the employee's record exists
            const employeeData = Object.values(attendanceData).find(
              (record) => record.name === viewEmployee.name
            );
  
            if (employeeData) {
              attendanceDetails.push({ date: formattedDate, ...employeeData });
              if (employeeData.status === "Present") presentCount++;
              if (employeeData.status === "Absent") absentCount++;
            }
          }
        } catch (error) {
          console.error(`Error fetching attendance for ${formattedDate}:`, error);
        }
      }
  
      const totalWorkingDays = presentCount + absentCount;
      console.log(
        `Present Count: ${presentCount}, Absent Count: ${absentCount}, Total Working Days: ${totalWorkingDays}`
      );
  
      // Update attendance counts and salary calculation
      setAttendanceCounts({
        presentCount,
        absentCount,
        totalWorkingDays,
        salary: totalWorkingDays > 0 ? (presentCount * viewEmployee.salary) / totalWorkingDays : 0,
        attendanceDetails, // Include attendance details for UI or debugging
      });
    } catch (error) {
      console.error("Error fetching attendance: ", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch attendance data. Please try again.",
      });
    }
  };
  
    
    const handleCheckboxChange = () => {
      console.log("Toggling monthly view. Current state:", isMonthly);
      setIsMonthly(!isMonthly); // Toggle the monthly view
    };
    const [activeTab, setActiveTab] = useState("salary"); // Default tab

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  

let downloadCount = 0; // This will track the download count for receipt number

const generateSalaryReceipt = (employee) => {
  const doc = new jsPDF();

  // Get current date and time for receipt and download date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString(); // Format as per locale (e.g., "01/16/2025, 3:15:00 PM")

  // Increment the download count for the receipt number
  downloadCount++;

  // Header with Address, Contact, and Email
  doc.setFontSize(12);
  // doc.setFont("helvetica", "normal");
  // doc.text("Address: 1234 Street, City, Country", 10, 15);
  // doc.text("Contact No: 123-456-7890", 10, 20);
  // doc.text("Email: info@company.com", 10, 25);

  // Receipt Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Salary Receipt", 105, 40, null, null, "center");

  // Receipt Date and Receipt Number
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt Date: ${formattedDate}`, 10, 50); // Current date and time
  doc.text(`Receipt Number: ${downloadCount}`, 10, 60); // Use the download count as the receipt number
  doc.text(`Employee ID: ${employee.id}`, 10, 70);

  // Employee Details
  doc.setFontSize(12);
  doc.text(`Name: ${employee.name}`, 10, 80);
  doc.text(`Contact: ${employee.contact}`, 10, 90);
  doc.text(`Role: ${employee.role}`, 10, 100);

  // Table Header for Attendance Details
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Summary", 10, 110);
  doc.line(10, 112, 200, 112); // Underline

  const tableStartY = 120;
  doc.text("Present Days", 15, tableStartY);
  doc.text("Absent Days", 75, tableStartY);
  doc.text("Total Working Days", 135, tableStartY);
  doc.text("Day Salary", 175, tableStartY);

  // Table Data
  doc.setFont("helvetica", "normal");
  const tableDataY = tableStartY + 10;
  doc.text(`${employee.presentCount}`, 15, tableDataY);
  doc.text(`${employee.absentCount}`, 75, tableDataY);
  doc.text(`${employee.totalWorkingDays}`, 135, tableDataY);
  doc.text(`${employee.salary}`, 175, tableDataY);

  // Amount Received Section (Displaying 1 for Yes, 0 for No)
  const amountDetailsY = tableDataY + 20;
  doc.setFont("helvetica", "bold");
  doc.text("Amount Received:", 10, amountDetailsY);

  doc.setFont("helvetica", "normal");
  const amountReceivedX = 50;
  const amountReceivedY = amountDetailsY - 5;
  doc.rect(amountReceivedX, amountReceivedY, 5, 5); // Create a checkbox-like box
  doc.text(employee.amountReceived ? "1" : "0", amountReceivedX + 7, amountReceivedY + 4); // Display 1 for Yes, 0 for No

  doc.text(`Salary Date: ${employee.salaryDate || "Not Paid"}`, 10, amountDetailsY + 10);

  // Authorized Signature Section
  const signatureY = amountDetailsY + 30;
  doc.text("Authorized Signature:", 10, signatureY);
  doc.line(60, signatureY, 110, signatureY); // Signature line

  // Footer Note
  const footerY = signatureY + 20;
  doc.setFontSize(10);
  doc.text(
    "This is a system-generated receipt. Please save it for your records.",
    10,
    footerY
  );

  // Save PDF with current date as the download date
  doc.save(`${employee.name}_Salary_Receipt_${downloadCount}.pdf`);
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

  const handleSaveToFirestore = async () => {
    try {
      if (!user || !user.email) {
        alert("User not logged in or email not available!");
        return;
      }
  
      // Prepare the data to save
      const employeeData = {
        name: viewEmployee.name,
        contact: viewEmployee.contact,
        role: viewEmployee.role,
        presentCount: attendanceCounts.presentCount || 0,
        absentCount: attendanceCounts.absentCount || 0,
        totalWorkingDays: attendanceCounts.totalWorkingDays || 0,
        salary:
          viewEmployee.salaryInterval === "monthly"
            ? (attendanceCounts.presentCount * viewEmployee.salary) /
              attendanceCounts.totalWorkingDays
            : attendanceCounts.presentCount * viewEmployee.salary,
        status: status,
        date: selectedDate, // The selected date (e.g., salary calculation date)
        salaryDate: salaryDate, // The specific salary date
        isMonthly: isMonthly,
        Netsalary:netSalary,
      };
  
      // Create a unique Firestore document path by combining employee ID and salary date
      const docPath = `${viewEmployee.id}_${salaryDate}`;
      const docRef = doc(db, "admins", user.email, "Salaryemp", docPath);
  
      // Save the data
      await setDoc(docRef, employeeData);
  
      alert("Employee salary details saved successfully!");
    } catch (error) {
      console.error("Error saving data to Firestore:", error);
      alert("Failed to save employee details. Please try again.");
    }
  };
  
  const [loading, setLoading] = useState(false);

  const fetchSalaryReport = async () => {
    try {
      if (!user || !user.email) {
        alert("User not logged in or email not available!");
        return;
      }

      setLoading(true);

      // Reference to the Firestore collection
      const salaryCollectionRef = collection(
        db,
        "admins",
        user.email,
        "Salaryemp"
      );

      // Fetch all documents in the collection
      const querySnapshot = await getDocs(salaryCollectionRef);
      const fetchedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSalaryData(fetchedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching salary report:", error);
      alert("Failed to fetch salary report. Please try again.");
      setLoading(false);
    }
  };

  const [selectedSalaryDate, setSelectedSalaryDate] = useState(new Date());
  const [viewEmployee, setViewEmployee] = useState(null);
  const [attendanceCounts, setAttendanceCounts] = useState({
    absentCount: 0,
    presentCount: 0,
    totalWorkingDays: 0,
  });
  const toggleStatus = () => {
    setStatus((prevStatus) => (prevStatus === "Pending" ? "Paid" : "Pending"));
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
 
  const handleCloseModal = () => {
    setViewEmployee(null); // Close the modal
    setAttendanceCounts({ presentCount: 0, absentCount: 0, totalWorkingDays: 0 }); // Reset attendance counts
    setSelectedDate(""); // Reset selected date
  };
  const [paidCount, setPaidCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const paid = salaryData.filter(employee => employee.status === true).length;
    const pending = salaryData.filter(employee => employee.status === false).length;
    
    setPaidCount(paid);
    setPendingCount(pending);
  }, [salaryData]);
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
        <h3 className="text-xl font-semibold">Paid Salary</h3>
        <p className="text-4xl font-bold">{paidCount}</p>
      </div>

      {/* Pending Salary Card */}
      <div className="bg-gradient-to-r from-orange-900 to-orange-900 p-6 rounded-lg shadow-lg text-center text-white w-80">
        <h3 className="text-xl font-semibold">Pending Salary</h3>
        <p className="text-4xl font-bold">{pendingCount}</p>
      </div>

        <div className="bg-gradient-to-r from-green-900 to-green-900 p-6 rounded-lg shadow-lg text-center text-white w-80">
          <h3 className="text-xl font-semibold">Overall Attendance (%)</h3>
          <p className="text-4xl font-bold">{overallAttendancePercentage}%</p>
        </div>
      </div>

      {/* Filter Section
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

      // {/* Add New Salary Button */}
      {/* // <div className="mb-6">
      //   <button */}
      {/* //     onClick={() => setIsModalOpen(true)}
      //     className="bg-gradient-to-r from-blue-900 to-blue-900 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-900 to-blue-900"
      //   >
      //     Add New Salary
      //   </button>
      // </div> */} 

      <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200 mt-6 p-4">
      <h2 className="text-xxl font-semibold mb-4">Payroll Management System</h2>
      <div>
      <div className="flex mb-4">
        <button
          className={`px-6 py-2 font-semibold text-lg rounded-lg ${
            activeTab === "salary"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:text-blue-600"
          }`}
          onClick={() => handleTabChange("salary")}
        >
          Salary
        </button>
        <button
  className={`ml-4 px-6 py-2 font-semibold text-lg rounded-lg ${
    activeTab === "report"
      ? "bg-blue-600 text-white"
      : "bg-gray-200 hover:text-blue-600"
  }`}
  onClick={() => {
    handleTabChange("report");
    fetchSalaryReport();
  }}
>
  Salary Report
</button>

      </div>
      {activeTab === "report" && (
        <div>
          {/* <button
            className="px-6 py-2 font-semibold text-lg hover:text-blue-600 bg-gray-200 rounded-lg"
            onClick={fetchSalaryReport}
          >
            Fetch Salary Report
          </button> */}
      {loading && <p className="mt-4">Loading salary report...</p>}

      {!loading && salaryData.length > 0 && (
            <table className="min-w-full bg-white border-collapse border border-gray-200 mt-4">
              <thead>
                <tr>
                  <th className="px-4 py-2 border border-gray-300">Name</th>
                  <th className="px-4 py-2 border border-gray-300">Contact</th>
                  <th className="px-4 py-2 border border-gray-300">Role</th>
                  <th className="px-4 py-2 border border-gray-300">Present Count</th>
                  <th className="px-4 py-2 border border-gray-300">Absent Count</th>
                  <th className="px-4 py-2 border border-gray-300">Salary Date</th>
                  <th className="px-4 py-2 border border-gray-300">
                   Net Salary
                  </th>
             
                  <th className="px-4 py-2 border border-gray-300">Status</th>
          
                  <th className="px-4 py-2 border border-gray-300">Salary Recepit</th>
                </tr>
              </thead>
              <tbody>
                {salaryData.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.name}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.contact}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.role}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.presentCount}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.absentCount}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.salaryDate}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.Netsalary}
                    
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {employee.status ? "Paid" : "Pending"}
                    </td>
                   
                    <td className="px-4 py-2 border border-gray-300">
  <button
    onClick={() => generateSalaryReceipt(employee)}
    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    {/* Font Awesome Download Icon */}
    <i className="fas fa-download"></i>
  </button>
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && salaryData.length === 0 && (
            <p className="mt-4">No salary reports available.</p>
          )}
        </div>
      )}</div>
       {activeTab === "salary" && (
        <div>
      <table className="min-w-full table-auto">
        <thead className="bg-gradient-to-r from-blue-900 to-blue-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left">Employee Name</th>
            <th className="px-6 py-3 text-left">Contact</th>
            <th className="px-4 py-3 text-left">Role</th>
            {/* <th className="px-4 py-3 text-left">Salary Date</th> */}
            <th className="px-4 py-3 text-left">Net Salary</th>
         
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
                <td className="px-4 py-2">{employee.contact}</td>
                <td className="px-4 py-2">{employee.role}</td>
               
                {/* <td className="px-4 py-2">
                <input
                  type="date"
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={salaryDate}
                  onChange={handleDateChangee}
                />
                </td> */}
                <td className="px-4 py-2">
                ₹{employee.salary} ({employee.salaryInterval})
</td>


<td className="px-3 py-2">
  <button
    onClick={() => setViewEmployee(employee)}
    className="text-blue-500 hover:text-blue-700 p-3 rounded-full transition duration-200 transform hover:scale-105 focus:outline-none"
  >
    <EyeIcon className="w-6 h-6" /> {/* The icon size */}
  </button>
</td>
              </tr>
            ))
          )}
        </tbody>

      </table>

      {viewEmployee && (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center">
    <div className="bg-gradient-to-r from-white-600 to-gray-400 rounded-lg p-8 mt-10 shadow-2xl max-w-3xl w-full text-white transition-all duration-300 transform hover:scale-105">
      <div className="flex justify-between items-center mb-6">
      <h3 className="text-2xl font-extrabold text-black">{viewEmployee.name}'s Details</h3>
        <button
          onClick={handleCloseModal}
          className="text-2xl font-bold text-black hover:text-red-500 transition-colors duration-300 m"
        >
          &times;
        </button>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
      <input
    type="date"
    value={selectedDate}
    onChange={handleDateChange}
    className="w-1/2 py-2 px-4 rounded-lg bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
  />
      </div>
      {/* <div className="flex items-center mb-6">
        <input
          type="checkbox"
          checked={isMonthly}
          onChange={handleCheckboxChange}
          className="mr-2 accent-indigo-500"
        />
        <label className="text-lg font-medium text-black">Show Monthly Attendance</label>
      </div> */}

      {/* Employee Details */}
      <div className="space-y-4 mb-6 text-black">
    
      <div className="grid grid-cols-2 gap-6">
  <div className="flex flex-col gap-4">
    <p><strong>Name:</strong> {viewEmployee.name}</p>
    <p><strong>Contact:</strong> {viewEmployee.contact}</p>
  </div>
  <div className="flex flex-col ml-10 gap-4">
    <p><strong>DOB:</strong> {viewEmployee.dob}</p>
    <p><strong>Role:</strong> {viewEmployee.role}</p>
  </div>
  </div>
  <div className="grid grid-cols-2 gap-6">
<div className="flex flex-col  gap-4">
        <p><strong>Present Count:</strong> {attendanceCounts.presentCount || 0}</p>
        </div>
        <div className="flex flex-col ml-10 gap-4">
        <p><strong>Absent Count:</strong> {attendanceCounts.absentCount || 0}</p>
      </div>
      </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-2 text-black">
        <label htmlFor="basicSalary" className="font-bold">Basic Salary:</label>
        <input
          type="number"
          id="basicSalary"
          value={basicSalary}
          onChange={(e) => setBasicSalary(Number(e.target.value))}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 "
          placeholder="Enter Basic Salary"
        />
      </div>

      <div className="flex flex-col ml-10 gap-2 text-black">
        <label htmlFor="bonus" className="font-bold">Bonus:</label>
        <input
          type="number"
          id="bonus"
          value={bonus}
          onChange={(e) => setBonus(Number(e.target.value))}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 "
          placeholder="Enter Bonus"
        />
      </div>

      <div className="flex flex-col gap-2 text-black">
        <label htmlFor="deductions" className="font-bold">Deductions:</label>
        <input
          type="number"
          id="deductions"
          value={deductions}
          onChange={(e) => setDeductions(Number(e.target.value))}
        className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 "
          placeholder="Enter Deductions"
        />
      </div>

      <div className="flex flex-col ml-10 gap-2 text-black">
        <label htmlFor="netSalary" className="font-bold">Net Salary:</label>
        <input
          type="number"
          id="netSalary"
          value={netSalary}
          readOnly
          className="border p-2 rounded bg-gray-200 "
          placeholder="Net Salary"
        />
      </div>
    </div>

      {/* Total Working Days Input
<div className="mb-6 text-black">
  <p><strong>Total Working Days</strong></p>
  <input
    type="number"
    placeholder="Enter Total Working Days"
    value={attendanceCounts.totalWorkingDays}
    readOnly  // Makes the input field non-editable
    className="w-full py-2 px-4 rounded-lg bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
  />
</div> */}
{/* <div className="mb-6 text-black">
  <p>
    <strong>Salary:</strong> $
    {attendanceCounts.totalWorkingDays > 0
      ? ((parseFloat(viewEmployee.salary || 0) / attendanceCounts.totalWorkingDays) * (attendanceCounts.totalWorkingDays - (attendanceCounts.absentCount || 0))).toFixed(2)
      : parseFloat(viewEmployee.salary || 0).toFixed(2)}
    ({viewEmployee.salaryInterval || 'Monthly'})
  </p>
</div> */}
     <div className="mt-6 text-black">
  {/* Status Section */}
  <p className="mb-2">
    <strong>Status: </strong>
    <span
      className={status ? 'text-green-800 font-bold' : 'text-red-500 font-bold'}
    >
      {status ? 'Paid' : 'Pending'}
    </span>
  </p>

  {/* Buttons Section */}
  <div className="flex justify-between items-center">
    <button
      onClick={handleStatusToggle}
      className={`py-2 px-4 rounded-lg text-white ${
        status ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
      } transition-colors duration-300`}
    >
      {status ? 'Mark as Pending' : 'Mark as Paid'}
    </button>

    <button
      onClick={handleSaveToFirestore}
      className="py-2 px-6 w-1/4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors duration-300"
    >
      Save
    </button>
  </div>
</div>

    </div>
  </div>
)}
  </div>
      )}
</div>
    
    </div>
  );
};

export default SalaryApp;
