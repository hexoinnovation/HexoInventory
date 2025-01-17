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

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [countries, setCountries] = useState([]);
  const [salaryIntervals, setSalaryIntervals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    photo: null,
    dob: "",
    gender: "",
    contact: "",
    email: "",
    role: "",
    salaryInterval: "",
    address: "",
    state: "",
    country: "",
  });
  const [viewEmployee, setViewEmployee] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [salaryIntervalFilter, setSalaryIntervalFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // Fetch user and employee data from Firestore
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = collection(
          db,
          "admins",
          currentUser.email,
          "Empdetails"
        );
        const q = query(userDocRef);
        const querySnapshot = await getDocs(q);
        const fetchedEmployees = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployees(fetchedEmployees);
      }

      // Fetch roles from Firestore
      const rolesQuery = query(collection(db, "roles"));
      const rolesSnapshot = await getDocs(rolesQuery);
      const fetchedRoles = rolesSnapshot.docs.map((doc) => doc.data());
      setRoles(fetchedRoles);

      // Fetch countries from Firestore
      const countriesQuery = query(collection(db, "countries"));
      const countriesSnapshot = await getDocs(countriesQuery);
      const fetchedCountries = countriesSnapshot.docs.map((doc) => doc.data());
      setCountries(fetchedCountries);

      // Fetch salary intervals from Firestore
      const salaryIntervalsQuery = query(collection(db, "salaryIntervals"));
      const salaryIntervalsSnapshot = await getDocs(salaryIntervalsQuery);
      const fetchedSalaryIntervals = salaryIntervalsSnapshot.docs.map((doc) =>
        doc.data()
      );
      setSalaryIntervals(fetchedSalaryIntervals);
    };

    fetchUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEmployee((prev) => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file); // Read file as Base64
    } else {
      setNewEmployee((prev) => ({ ...prev, [name]: value }));
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state

const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
        Swal.fire({
            title: "Error!",
            text: "Please log in to add or update employee details.",
            icon: "error",
            confirmButtonText: "OK",
        });
        return;
    }

    if (isSubmitting) return; // Prevent duplicate submissions

    setIsSubmitting(true); // Set loading state to true

    try {
        let photoURL = "";

        if (newEmployee.photo) {
            photoURL = newEmployee.photo;
        }

        const userDocRef = collection(db, "admins", user.email, "Empdetails");
        const employeeData = {
            ...newEmployee,
            photo: photoURL,
        };

        if (newEmployee.id) {
            // Update existing employee
            const employeeDocRef = doc(userDocRef, newEmployee.id);
            await updateDoc(employeeDocRef, employeeData);
            setEmployees((prev) =>
                prev.map((emp) =>
                    emp.id === newEmployee.id ? { ...emp, ...employeeData } : emp
                )
            );
            Swal.fire({
                title: "Updated!",
                text: "Employee updated successfully!",
                icon: "success",
                showConfirmButton: false,
                timer: 2000,
            });
        } else {
            // Add new employee
            const newDocRef = await addDoc(userDocRef, employeeData);
            setEmployees((prev) => [
                ...prev,
                { id: newDocRef.id, ...employeeData },
            ]);
            Swal.fire({
                title: "Added!",
                text: "Employee added successfully!",
                icon: "success",
                showConfirmButton: false,
                timer: 2000,
            });
        }

        setIsModalOpen(false);
        setNewEmployee({
            name: "",
            photo: null,
            dob: "",
            gender: "",
            contact: "",
            email: "",
            role: "",
            salaryInterval: "",
            address: "",
            state: "",
            country: "",
        });
        setIsEditMode(false); // Reset edit mode
    } catch (error) {
        console.error("Error adding/updating employee:", error);
        Swal.fire({
            title: "Error!",
            text: "Failed to add/update employee. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
        });
    } finally {
        setIsSubmitting(false); // Reset loading state
    }
};

  const handleEdit = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    setNewEmployee(employee);
    setIsEditMode(true); // Set to edit mode
    setIsModalOpen(true); // Open the modal for editing
  };

  const handleView = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    setViewEmployee(employee);
    setIsViewModalOpen(true); // Open the modal for viewing employee details
  };

  const handleDelete = async (employeeId) => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please log in to delete employee details.",
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
        const userDocRef = collection(db, "admins", user.email, "Empdetails");
        const employeeDocRef = doc(userDocRef, employeeId);

        await deleteDoc(employeeDocRef);
        setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));

        Swal.fire({
          title: "Deleted!",
          text: "The employee has been deleted.",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
        });
      } catch (error) {
        console.error("Error deleting employee:", error);
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: "Failed to delete employee. Please try again.",
        });
      }
    }
  };

  // Reset all filter options
  const resetFilters = () => {
    setRoleFilter("");
    setSalaryIntervalFilter("");
    setCountryFilter("");
    setStateFilter("");
    setSearchTerm("");
  };

  // Filter employees based on multiple criteria
  const filteredEmployees = employees.filter((employee) => {
    return (
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) && // Search by name
      (roleFilter ? employee.role === roleFilter : true) && // Filter by Role
      (salaryIntervalFilter
        ? employee.salaryInterval === salaryIntervalFilter
        : true) && // Filter by Salary Interval
      (countryFilter ? employee.country === countryFilter : true) && // Filter by Country
      (stateFilter ? employee.state === stateFilter : true) // Filter by State
    );
  });

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Info Box Section */}
      <div className="flex space-x-6 mb-6">
        {/* Total Employees Info Box */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total Employees</h3>
          <p className="text-4xl font-bold">{filteredEmployees.length}</p>
        </div>

        {/* Total Roles Info Box */}
        <div className="bg-gradient-to-r from-indigo-400 to-purple-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total Roles</h3>
          <p className="text-4xl font-bold">{roles.length}</p>
        </div>

        {/* Total Countries Info Box */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total Countries</h3>
          <p className="text-4xl font-bold">{countries.length}</p>
        </div>

        {/* Total Salary Intervals Info Box */}
        <div className="bg-gradient-to-r from-pink-400 to-red-500 p-6 rounded-lg shadow-lg text-center text-white w-80 transform transition duration-500 ease-in-out hover:scale-105">
          <h3 className="text-xl font-semibold">Total Salary Intervals</h3>
          <p className="text-4xl font-bold">{salaryIntervals.length}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-blue-900 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Search by Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Search by Name
            </label>
            <input
              type="text"
              placeholder="Search Employee..."
              className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Handle search term change
            />
          </div>

          {/* Filter by Role */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Filter by Role
            </label>
            <select
              className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)} // Handle role filter change
            >
              <option value="">Select Role</option>
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporary</option>
              <option value="Dailywages">Daily Wages</option>
            </select>
          </div>

          {/* Filter by Salary Interval */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Filter by Salary Interval
            </label>
            <select
              className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
              value={salaryIntervalFilter}
              onChange={(e) => setSalaryIntervalFilter(e.target.value)} // Handle salary interval filter change
            >
              <option value="">Select Salary Interval</option>
              <option value="Per Month">Per Month</option>
              <option value="Per Week">Per Week</option>
              <option value="Per Day">Per Day</option>
            </select>
          </div>

          {/* Filter by Country */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Filter by Country
            </label>
            <select
              className="w-full py-3 pl-4 pr-4 border-2 border-blue-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)} // Handle country filter change
            >
              <option value="">Select Country</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Japan">Japan</option>
              <option value="Germany">Germany</option>
              <option value="Sri Lanka">Sri Lanka</option>
            </select>
          </div>

          {/* Reset Filter Button */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-100 mb-2">
              Reset
            </label>
            <button
              onClick={resetFilters}
              className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-md hover:bg-red-600 w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      {/* Add New Employee Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-900 to-blue-900 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-600"
        >
          Add New Employee
        </button>
      </div>

      {/* Employee Table Section */}
      <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200 mt-6">
        <table className="min-w-full table-auto mt-4">
          <thead className="bg-gradient-to-r from-blue-900 to-blue-900 text-white">
            <tr>
              <th className="px-20 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Date of Birth</th>
              <th className="px-4 py-2 text-left">Contact</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Salary</th>
              <th className="px-4 py-2 text-left">Salary Interval</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-4 text-red-500 font-semibold"
                >
                  No Employee Found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id} className="border-b">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-5">
                      <img
                        src={employee.photo}
                        alt="Employee"
                        className="rounded-full w-15 h-14"
                      />
                      <span>{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{employee.dob}</td>
                  <td className="px-4 py-2">{employee.contact}</td>
                  <td className="px-4 py-2">{employee.email}</td>
                  <td className="px-4 py-2">{employee.role}</td>
                  <td className="px-4 py-2">₹{employee.salary}</td>
                  <td className="px-4 py-2">{employee.salaryInterval}</td>
                  <td className="px-3 py-2">
                    <div className="flex space-x-1">
                      <button
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full transition duration-200"
                        onClick={() => handleView(employee.id)}
                      >
                        <i className="fas fa-eye"></i> {/* View Icon */}
                      </button>
                      <button
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full transition duration-200"
                        onClick={() => handleEdit(employee.id)}
                      >
                        <i className="fas fa-pencil-alt"></i> {/* Edit Icon */}
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 p-2 rounded-full transition duration-200"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <i className="fas fa-trash"></i> {/* Trash Icon */}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isViewModalOpen && viewEmployee && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-50">
    <div className="bg-blue-900 p-6 rounded-xl shadow-lg w-full max-w-2xl sm:max-w-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Employee Details</h2>
        <button
          onClick={() => setIsViewModalOpen(false)}
          className="text-red-500 hover:text-blue-500 text-4xl font-bold"
        >
          &times;
        </button>
      </div>

      {/* Resume Content */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {/* Left Column: Profile Picture and Basic Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            {viewEmployee.photo ? (
              <img
                src={viewEmployee.photo}
                alt="Profile"
                className="w-26 h-28 rounded-full object-cover border-4 border-gray-100"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center border-4 border-indigo-500">
                <span className="text-xl text-white">No Photo</span>
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-blue-100">{viewEmployee.name}</h3>
              <p className="text-gray-100">{viewEmployee.role}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-100">Contact Information</h3>
              <p className="text-gray-100">Phone: {viewEmployee.contact}</p>
              <p className="text-gray-100">Email: {viewEmployee.email}</p>
              <p className="text-gray-100">Address: {viewEmployee.address}</p>
            </div>
          </div>

          {/* Address and Country */}
          <div>
            <h3 className="text-lg font-semibold text-blue-100">Location</h3>
            <p className="text-gray-100">State: {viewEmployee.state}</p>
            <p className="text-gray-100">Country: {viewEmployee.country}</p>
          </div>
        </div>

        {/* Right Column: Detailed Info (DOB, Salary, etc.) */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-100">Personal Details</h3>
            <p className="text-gray-100">Date of Birth: {viewEmployee.dob}</p>
            <p className="text-gray-100">Gender: {viewEmployee.gender}</p>
          </div>

          {/* Job Information */}
          <div>
            <h3 className="text-lg font-semibold text-blue-100">Job Details</h3>
            <p className="text-gray-100">Role: {viewEmployee.role}</p>
            <p className="text-gray-100">Per day Salary: ₹{viewEmployee.salary}</p>
            <p className="text-gray-100">Salary Interval: {viewEmployee.salaryInterval}</p>
          </div>

          {/* Skills or Other Info (Optional) */}
          <div>
            <h3 className="text-lg font-semibold text-blue-100">Skills/Additional Information</h3>
            <p className="text-gray-100">Skills: (Add any skills if available)</p>
          </div>
        </div>
      </div>

      {/* Modal Close Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => setIsViewModalOpen(false)}
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}



      {/* Modal to Add or Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
          <div className="bg-blue-900 p-5 rounded-xl shadow-lg w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100">
                {isEditMode ? "Edit Employee" : "Add Employee"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-red-500 hover:text-blue-500 text-4xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-100">
                  Personal Information
                </h3>

                <div className="grid grid-cols-3 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newEmployee.name}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={newEmployee.dob}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Gender
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center text-gray-100">
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Male
                      </label>
                      <label className="flex items-center text-gray-100">
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Female
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="contact"
                      value={newEmployee.contact}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newEmployee.email}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      type="file"
                      name="photo"
                      onChange={handleInputChange}
                      accept="image/*"
                      className="border border-gray-100 rounded-lg p-2 w-full focus:ring-2 focus:ring-gray-100 focus:outline-none"
                    />
                    {newEmployee.photo && (
                      <div className="mt-4">
                        <img
                          src={newEmployee.photo}
                          alt="Profile Preview"
                          className="w-32 h-32 object-cover rounded-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-100">
                  Address Information
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={newEmployee.address}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={newEmployee.state}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Country
                    </label>
                    <select
                      name="country"
                      value={newEmployee.country}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Role & Salary Information Section */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-100">
                  Job Information
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Role
                    </label>
                    <select
                      name="role"
                      value={newEmployee.role}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="Permanent">Permanent</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Dailywages">Daily Wages</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Salary
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={newEmployee.salary}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-100">
                      Salary Interval
                    </label>
                    <select
                      name="salaryInterval"
                      value={newEmployee.salaryInterval}
                      onChange={handleInputChange}
                      className="border border-gray-100 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Salary Interval</option>
                      <option value="Per Month">Per Month</option>
                      <option value="Per Week">Per Week</option>
                      <option value="Per Day">Per Day</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
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
  className={`bg-blue-600 text-white px-6 py-3 rounded-lg ${
    isSubmitting ? "cursor-not-allowed opacity-50" : "hover:bg-blue-700"
  }`}
  disabled={isSubmitting} // Disable the button while submitting
>
  {isSubmitting
    ? "Processing..." // Show feedback during submission
    : isEditMode
    ? "Update Employee"
    : "Add Employee"}
</button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
