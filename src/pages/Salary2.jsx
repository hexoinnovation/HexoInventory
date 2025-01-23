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

import { EyeIcon,BriefcaseIcon } from '@heroicons/react/outline'; // Import the icon
import jsPDF from "jspdf";
import "jspdf-autotable";
import '@fortawesome/fontawesome-free/css/all.min.css';

const db = getFirestore();
const auth = getAuth();

const SalaryApp = ({ updateSalaryStatus }) => {  // Destructure props properly
  const [viewEmployee, setViewEmployee] = useState(null);
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
 
  const [bonus, setBonus] = useState("");  
  const [deductions, setDeductions] = useState("");  
  const [netSalary, setNetSalary] = useState(0);  

  const basicSalary = viewEmployee?.salary || 0;  

  useEffect(() => {
    const numericBonus = bonus === "" ? 0 : Number(bonus);  
    const numericDeductions = deductions === "" ? 0 : Number(deductions);  
    const calculatedNetSalary = Number(basicSalary) + numericBonus - numericDeductions;
    setNetSalary(calculatedNetSalary);  
  }, [bonus, deductions, basicSalary]); 
  
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);

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
        calculateAttendanceCounts ( fetchedAttendances);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchUserAndEmployees();
  }, []);
  

  const [salaryDate, setSalaryDate] = useState("");
  const handleStatusToggle = () => {
    setStatus((prevStatus) => !prevStatus); 
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
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
  
      console.log(`Fetching attendance for the month from ${start.toISOString()} to ${end.toISOString()}`);
  
      let presentCount = 0;
      let absentCount = 0;
      const attendanceDetails = [];
  
      // Generate an array of promises for each day in the month
      const promises = [];
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const formattedDate = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        const docRef = doc(db, "admins", user.email, "attendance", formattedDate);
        const promise = getDoc(docRef).then((docSnap) => {
          if (docSnap.exists()) {
            const attendanceData = docSnap.data();
            console.log(`Fetched Attendance for ${formattedDate}:`, attendanceData);
  
            const employeeData = Object.values(attendanceData).find(
              (record) => record.name === viewEmployee.name
            );
  
            if (employeeData) {
              attendanceDetails.push({ date: formattedDate, ...employeeData });
              if (employeeData.status === "Present") presentCount++;
              if (employeeData.status === "Absent") absentCount++;
            }
          }
        }).catch((error) => {
          console.error(`Error fetching attendance for ${formattedDate}:`, error);
        });
  
        promises.push(promise);
      }
  
      // Wait for all promises to complete
      await Promise.all(promises);
  
      const totalWorkingDays = presentCount + absentCount;
      console.log(`Present Count: ${presentCount}, Absent Count: ${absentCount}, Total Working Days: ${totalWorkingDays}`);
  
      setAttendanceCounts({
        presentCount,
        absentCount,
        totalWorkingDays,
        salary: totalWorkingDays > 0 ? (presentCount * viewEmployee.salary) / totalWorkingDays : 0,
        attendanceDetails,
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
  
    const [activeTab, setActiveTab] = useState("salary"); // Default tab

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  

let downloadCount = 0; 


const generateSalaryReceipt = (employee) => {
  const doc = new jsPDF();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString(); 

  downloadCount++;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Salary Receipt", 105, 40, null, null, "center");

  // Receipt Date and Receipt Number
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt Date: ${formattedDate}`, 10, 50);
 // doc.text(`Receipt Number: ${downloadCount}`, 10, 60); // Automatically increment the receipt number
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

  // Table Header
  const tableStartY = 120;
  const colWidth = [50, 40, 40, 60, 50, 50]; // Column widths (including Bonus and Deductions)
  doc.text("Salary Date", 10, tableStartY);
  doc.text("Present Days", 60, tableStartY);
  doc.text("Absent Days", 110, tableStartY);
  doc.text("Day Salary", 160, tableStartY);
  doc.text("Bonus", 210, tableStartY);
  doc.text("Deductions", 260, tableStartY);

  // Horizontal line after header
  doc.line(10, tableStartY + 2, 300, tableStartY + 2); // Extend line to cover extra columns

  // Table Data
  doc.setFont("helvetica", "normal");
  const tableDataY = tableStartY + 10;

  // Add data to table
  doc.text(`${employee.date}`, 10, tableDataY);
  doc.text(`${employee.presentCount}`, 60, tableDataY);
  doc.text(`${employee.absentCount}`, 110, tableDataY);
  doc.text(`${employee.Netsalary}`, 160, tableDataY);
  doc.text(`${employee.Bonus}`, 210, tableDataY);
  doc.text(`${employee.Deduction}`, 260, tableDataY);

  // Horizontal line after table row
  doc.line(10, tableDataY + 2, 300, tableDataY + 2);

  // Adjust positioning for additional rows (if more rows, use a loop for Y positioning)

  // Amount Received Section
  const amountDetailsY = tableDataY + 20;
  doc.setFont("helvetica", "bold");
  doc.text("Amount Received:", 10, amountDetailsY);

  doc.setFont("helvetica", "normal");
 

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
        status: status,
        date: selectedDate, 
        Netsalary:netSalary,
        Bonus:bonus,
        Deduction:deductions,
      };
      const docPath = `${viewEmployee.id}_${salaryDate}`;
      const docRef = doc(db, "admins", user.email, "Salaryemp", docPath);
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
      employeeRole: employee ? employee.role : "N/A", 
      presentCount,
      absentCount,
    };
  });
 
  const handleCloseModal = () => {
    setViewEmployee(null); 
    setAttendanceCounts({ presentCount: 0, absentCount: 0, totalWorkingDays: 0 }); 
    setSelectedDate(""); 
    setBonus(""); 
    setDeductions(""); 
    setNetSalary(0); 
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
      <div className="flex justify-between gap-6 mb-6">
  {/* Total Employees Card */}
  <div className="bg-gradient-to-r from-blue-700 to-blue-700 p-6 rounded-lg shadow-lg text-center text-white flex-1">
    <h3 className="text-xl font-semibold">Total Employees</h3>
    <p className="text-4xl font-bold">{totalEmployees}</p>
  </div>

  {/* Paid Salary Card */}
  <div className="bg-gradient-to-r from-purple-900 to-purple-900 p-6 rounded-lg shadow-lg text-center text-white flex-1">
    <h3 className="text-xl font-semibold">Paid Salary</h3>
    <p className="text-4xl font-bold">{paidCount}</p>
  </div>

  {/* Pending Salary Card */}
  <div className="bg-gradient-to-r from-orange-900 to-orange-900 p-6 rounded-lg shadow-lg text-center text-white flex-1">
    <h3 className="text-xl font-semibold">Pending Salary</h3>
    <p className="text-4xl font-bold">{pendingCount}</p>
  </div>
</div>


      <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200 mt-6 p-4">
    
  <div className="flex items-center mb-4">
    <BriefcaseIcon className="h-6 w-6 text-indigo-600 mr-2" />
    <h2 className="text-2xl font-semibold">Payroll Management System</h2>
  </div>

      <div>
      <div className="flex  mt-10 mb-6">
        <button
          className={`px-6 py-2 font-semibold text-lg rounded-lg ${
            activeTab === "salary"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:text-blue-600 "
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
   {loading && (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute w-16 h-16 border-4 border-gray-300 border-t-4 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="absolute w-16 h-16 border-4 border-gray-300 border-b-4 border-b-blue-500 rounded-full animate-spin-reverse"></div>
    </div>
    <p className="text-lg text-gray-700">Loading salary report...</p>
  </div>
)}

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
                      {employee.date}
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
            <th className="px-4 py-3 text-left">Basic salary</th>
         
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
                <td className="px-4 py-2">₹{employee.salary}</td>


<td className="px-3 py-2">
  <button
    onClick={() => setViewEmployee(employee)}
    className="text-blue-500 hover:text-blue-700 p-3 rounded-full transition duration-200 transform hover:scale-105 focus:outline-none"
  >
    <EyeIcon className="w-6 h-6" /> 
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
      <div className="mb-6">
      <input
    type="date"
    value={selectedDate}
    onChange={handleDateChange}
    className="w-1/2 py-2 px-4 rounded-lg bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
  />
      </div>
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
        <p id="basicSalary" className="border p-2 rounded bg-gray-100 text-gray-700">
          ₹ {basicSalary}
        </p>
      </div>

      <div className="flex flex-col ml-10 gap-2 text-black">
        <label htmlFor="bonus" className="font-bold">Bonus:</label>
        <input
          type="number"
          id="bonus"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)} 
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter Bonus"
        />
      </div>

      <div className="flex flex-col gap-2 text-black">
        <label htmlFor="deductions" className="font-bold">Deductions:</label>
        <input
          type="number"
          id="deductions"
          value={deductions}
          onChange={(e) => setDeductions(e.target.value)} 
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter Deductions"
        />
      </div>

      <div className="flex flex-col ml-10 gap-2 text-black">
        <label htmlFor="netSalary" className="font-bold">Net Salary:</label>
        <p id="netSalary" className="border p-2 rounded bg-gray-200">
          ₹ {netSalary}
        </p>
      </div>
    </div>

     
     <div className="mt-6 text-black">
  <p className="mb-2">
    <strong>Status: </strong>
    <span
      className={status ? 'text-green-800 font-bold' : 'text-red-500 font-bold'}
    >
      {status ? 'Paid' : 'Pending'}
    </span>
  </p>

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
