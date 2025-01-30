import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { collection, onSnapshot, getDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth } from "../config/firebase"; // Import Firebase instance and auth
import { getAuth } from 'firebase/auth'; 

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Info Box component for displaying stats
const InfoBox = ({ title, value, description, color }) => {
  return (
    <div
      className={`flex items-center p-6 bg-gradient-to-r ${color} rounded-xl shadow-lg hover:shadow-2xl transition`}
    >
      <span className="text-white text-4xl font-semibold mr-6">{value}</span>
      <div>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="text-gray-200">{description}</p>
      </div>
    </div>
  );
};

const HRMControl = () => {
  const [currentUser] = useAuthState(auth); // Get the current user using Firebase hook
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [presentEmployees, setPresentEmployees] = useState(0);
  const [absentEmployees, setAbsentEmployees] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [roleFilter, setRoleFilter] = useState(""); // Role filter state

  // Fetch employee data from Firestore on mount
  useEffect(() => {
    if (currentUser?.email) {
      // Path to Empdetails in the Firestore database
      const userDocRef = collection(db, "admins", currentUser.email, "Empdetails");

      // Fetch Total Employees Count
      const fetchTotalEmployees = async () => {
        try {
          const snapshot = await getDoc(doc(db, "admins", currentUser.email));
          const adminData = snapshot.data();
          if (adminData && adminData.totalEmployees) {
            setTotalEmployees(adminData.totalEmployees);
          }
        } catch (error) {
          console.error("Error fetching total employees:", error);
        }
      };

      // Fetch Employee Details
      const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
        const employeeData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEmployees(employeeData);

        // Calculate Present and Absent Employees
        const present = employeeData.filter(
          (employee) => employee.attendance === "Present"
        ).length;
        const absent = employeeData.filter(
          (employee) => employee.attendance === "Absent"
        ).length;

        setPresentEmployees(present);
        setAbsentEmployees(absent);
      });

      // Fetch total employees count once
      fetchTotalEmployees();

      // Cleanup the snapshot listener
      return () => unsubscribe();
    }
  }, [currentUser?.email]);




  // Pie chart data for attendance distribution
  const attendanceData = {
    labels: ["Total Employees"],
    datasets: [
      {
        label: "Total Employees",
        data: [totalEmployees], // ✅ Now `paidCount` is initialized
        backgroundColor: [
          "rgba(38, 228, 79, 0.7)",
          "rgba(54, 162, 235, 0.7)",  
          
          "rgba(219, 30, 5, 0.7)",  
        ],
        borderColor: [
          "rgba(38, 228, 79, 0.7)",
          "rgba(54, 162, 235, 1)",  
          "rgba(219, 30, 5, 1)",  
        ],
        borderWidth: 1,
      },
    ],
  };

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        if (!currentUser || !currentUser.email) {
          console.error("User not authenticated or email missing.");
          return;
        }

        // Reference to the user's "Empdetails" collection
        const empDetailsCollectionRef = collection(db, "admins", currentUser.email, "Empdetails");

        // Fetch all employee documents
        const empDetailsSnapshot = await getDocs(empDetailsCollectionRef);

        // Count the number of documents in the collection
        const employeeCount = empDetailsSnapshot.size;

        console.log("Total Employees:", employeeCount);

        // Update the state
        setTotalEmployees(employeeCount);
      } catch (error) {
        console.error("Error fetching employee count:", error.message);
      }
    };

    fetchEmployeeCount();
  }, [currentUser]);

  // Filter employees based on multiple criteria including search term and role filter
  const filteredEmployees = employees.filter((employee) => {
    return (
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) && // Search by name
      (roleFilter ? employee.role === roleFilter : true) && // Filter by Role
      (employee.attendance === "Present" || employee.attendance === "Absent") // Ensure attendance filter
    );
  });

// Fetch employee data
const fetchEmployees = async () => {
  const querySnapshot = await getDocs(userDocRef);
  const employeeList = querySnapshot.docs.map((doc) => doc.data());
  setFilteredEmployees(employeeList); // Assuming setFilteredEmployees is your state setter for employee data
};



const [paidCount, setPaidCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const user = getAuth().currentUser;
  const userEmail = user ? user.email : null;  // Safely get the user email
  // Fetch salary data for the logged-in user and calculate the counts
  useEffect(() => {
    if (!userEmail) return;  // If no user is logged in, don't fetch the data
    const fetchSalaryData = async () => {
      try {
        // Reference to the "Salaryemp" sub-collection for the current user
        const salaryCollectionRef = collection(db, "admins", userEmail, "Salaryemp");

        // Query to get documents where status is true (Paid)
        const paidQuery = query(salaryCollectionRef, where("status", "==", true));
        const paidSnapshot = await getDocs(paidQuery);
        setPaidCount(paidSnapshot.size); // Set the paid count based on the number of documents

        // Query to get documents where status is false (Pending)
        const pendingQuery = query(salaryCollectionRef, where("status", "==", false));
        const pendingSnapshot = await getDocs(pendingQuery);
        setPendingCount(pendingSnapshot.size); // Set the pending count based on the number of documents
      } catch (error) {
        console.error("Error fetching salary data:", error);
      }
    };

    fetchSalaryData();
  }, [userEmail]);  // Re-run when userEmail changes


  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!currentUser?.email) return;

    const fetchEmployees = async () => {
      try {
        const userDocRef = collection(db, "admins", currentUser.email, "Empdetails");
        const querySnapshot = await getDocs(userDocRef);

        const employeeList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEmployees(employeeList);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [currentUser?.email]);
  // if (loading) return <p className="text-center text-gray-400">Loading...</p>;
 


  return (
    <main className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Header Title */}
      <div className="head-title flex justify-between items-center mb-12 bg-gradient-to-r from-blue-800 to-blue-600 p-8 rounded-2xl shadow-2xl">
        <div className="left">
          <h1 className="text-5xl font-bold text-white">HRM Dashboard</h1>
          <ul className="breadcrumb flex space-x-3 text-sm text-white-400">
            <li>
              <a href="#" className="text-white hover:text-blue-400">Dashboard</a>
            </li>
            <li>
              <i className="bx bx-chevron-right text-gray-400"></i>
            </li>
            <li>
              <a href="#" className="text-white hover:text-blue-400">HRM</a>
            </li>
          </ul>
        </div>
      </div>



      {/* Info Boxes for HRM Stats */}
      <ul className="box-info grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        {/* Total Employees Info Box */}
        <li>
          <InfoBox
            title="Total Employees"
            value={totalEmployees}
            description="Total Number of Employees"
            color="from-blue-600 via-blue-700 to-blue-800"
          />
        </li>

        {/* Present Employees Info Box */}
        <li>
          <InfoBox
            title="Paid Salary"
            value={paidCount}
            description="Employees Paid Salary"
            color="from-green-600 via-green-700 to-green-800"
          />
        </li>

        {/* Absent Employees Info Box */}
        <li>
          <InfoBox
            title="Pending Salary"
            value={pendingCount}
            description="Employees Pending Salary"
            color="from-red-600 via-red-700 to-red-800"
          />
        </li>
      </ul>

      {/* Layout with Two Columns: Pie Chart and Employee Table */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        {/* Left Column: Employee Table */}
        <div className="employee-table bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-100 mb-6">Employee List</h3>
          <table className="min-w-full table-auto text-gray-100">
      <thead className="bg-blue-900">
        <tr>
          <th className="px-6 py-4 text-left text-white">No</th>
          {/* <th className="px-6 py-4 text-left text-white">DOB</th> */}
          <th className="px-6 py-4 text-left text-white">Profiles</th>
          <th className="px-6 py-4 text-left text-white">Name</th>
          <th className="px-6 py-4 text-left text-white">Role</th>
          <th className="px-6 py-4 text-left text-white">Salary</th>
        </tr>
      </thead>
      <tbody>
  {employees.length === 0 ? (
    <tr>
      <td colSpan="6" className="text-center py-4 text-red-500 font-semibold">
        No Employee Found
      </td>
    </tr>
  ) : (
    employees.slice(-5).map((employee, index) => (
      <tr key={employee.id}>
        <td className="px-6 py-4 text-left">{index + 1}</td>
        <td className="px-6 py-4 text-left">
          <div className="flex items-center gap-5">
            <img
              src={employee.photo || "/default-profile.png"} // Fallback image
              alt="Employee"
              className="rounded-full w-15 h-14"
            />
          </div>
        </td>
        <td className="px-6 py-4 text-left">{employee.name}</td>
        <td className="px-6 py-4 text-left">{employee.role}</td>
        <td className="px-6 py-4 ">₹{employee.salary}</td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>

        {/* Right Column: Pie Chart */}
        <div className="chart-container bg-gradient-to-r from-white-900 via-white-700 to-white-800 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">Employees Distribution</h3>
          <div className="w-full max-w-xs mx-auto">
          <Pie data={attendanceData} options={{ responsive: true }} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default HRMControl;
