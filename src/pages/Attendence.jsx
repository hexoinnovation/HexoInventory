import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faDownload, faEdit } from "@fortawesome/free-solid-svg-icons";
import { faTimes, faFilter } from "@fortawesome/free-solid-svg-icons";
import { db, auth } from "../config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

const AttendanceTable = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [monthlyFilter, setMonthlyFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [nameFilter, setNameFilter] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [attendanceChanged, setAttendanceChanged] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState(null);

  const currentUser = auth.currentUser;
  const currentDate = new Date();
  const formattedDate = `${currentDate
    .getDate()
    .toString()
    .padStart(2, "0")}.${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${currentDate.getFullYear()}`;

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentUser || !currentUser.email) return;

      try {
        const empDetailsRef = collection(
          db,
          "admins",
          currentUser.email,
          "Empdetails"
        );
        const empSnapshot = await getDocs(empDetailsRef);
        const fetchedEmployees = empSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const attendanceRef = doc(
          db,
          "admins",
          currentUser.email,
          "attendance",
          formattedDate
        );
        const attendanceSnap = await getDoc(attendanceRef);

        if (attendanceSnap.exists()) {
          const attendanceData = attendanceSnap.data();
          const updatedEmployees = fetchedEmployees.map((employee) => {
            const attendanceRecord = attendanceData.employees.find(
              (att) => att.id === employee.id
            );
            return {
              ...employee,
              attendance: attendanceRecord ? attendanceRecord.status : "Absent",
            };
          });
          setEmployees(updatedEmployees);
          setFilteredEmployees(updatedEmployees);
        } else {
          const defaultAttendance = fetchedEmployees.map((employee) => ({
            ...employee,
            attendance: "Absent",
          }));
          setEmployees(defaultAttendance);
          setFilteredEmployees(defaultAttendance);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchEmployees();
  }, [currentUser, formattedDate]);

  const handleFilters = () => {
    let filtered = [...employees];

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (employee) => employee.attendance === statusFilter
      );
    }

    if (roleFilter !== "All") {
      filtered = filtered.filter((employee) => employee.role === roleFilter);
    }

    if (nameFilter) {
      filtered = filtered.filter((employee) =>
        employee.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (contactFilter) {
      filtered = filtered.filter((employee) =>
        employee.contact.includes(contactFilter)
      );
    }

    if (filterDate) {
      if (monthlyFilter) {
        const selectedMonth = filterDate.split("-")[1];
        filtered = filtered.filter(
          (employee) =>
            employee.date && employee.date.split(".")[1] === selectedMonth
        );
      } else {
        filtered = filtered.filter(
          (employee) =>
            employee.date === filterDate.split("-").reverse().join(".")
        );
      }
    }

    setFilteredEmployees(filtered);
  };

  useEffect(() => {
    handleFilters();
  }, [
    statusFilter,
    roleFilter,
    nameFilter,
    contactFilter,
    filterDate,
    monthlyFilter,
  ]);

  const toggleAttendance = async (employeeId, currentStatus) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";

    try {
      const attendanceRef = doc(
        db,
        "admins",
        currentUser.email,
        "attendance",
        formattedDate
      );
      const attendanceSnap = await getDoc(attendanceRef);

      if (attendanceSnap.exists()) {
        const attendanceData = attendanceSnap.data();
        const updatedEmployees = attendanceData.employees.map((emp) =>
          emp.id === employeeId ? { ...emp, status: newStatus } : emp
        );

        await updateDoc(attendanceRef, {
          employees: updatedEmployees,
        });

        setEmployees((prevEmployees) =>
          prevEmployees.map((employee) =>
            employee.id === employeeId
              ? { ...employee, attendance: newStatus }
              : employee
          )
        );
        setFilteredEmployees((prevEmployees) =>
          prevEmployees.map((employee) =>
            employee.id === employeeId
              ? { ...employee, attendance: newStatus }
              : employee
          )
        );
        setAttendanceChanged(true);
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const saveAttendance = async () => {
    try {
      const attendanceRef = doc(
        db,
        "admins",
        currentUser.email,
        "attendance",
        formattedDate
      );
      const attendanceSnap = await getDoc(attendanceRef);

      if (attendanceSnap.exists()) {
        const attendanceData = attendanceSnap.data();
        const updatedEmployees = employees.map((employee) => ({
          ...employee,
          status: employee.attendance,
        }));

        await updateDoc(attendanceRef, {
          employees: updatedEmployees,
        });

        setAttendanceChanged(false);
        alert("Attendance saved successfully!");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setEditedEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedEmployee({
      ...editedEmployee,
      [name]: value,
    });
  };

  const saveEditedEmployee = async () => {
    try {
      const employeeRef = doc(
        db,
        "admins",
        currentUser.email,
        "Empdetails",
        editedEmployee.id
      );
      await updateDoc(employeeRef, {
        name: editedEmployee.name,
        dob: editedEmployee.dob,
        contact: editedEmployee.contact,
        email: editedEmployee.email,
        role: editedEmployee.role,
      });
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) =>
          employee.id === editedEmployee.id ? editedEmployee : employee
        )
      );
      setIsEditing(false);
      alert("Employee details updated successfully!");
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const totalEmployees = employees.length;
  const totalPresent = employees.filter(
    (employee) => employee.attendance === "Present"
  ).length;
  const totalAbsent = employees.filter(
    (employee) => employee.attendance === "Absent"
  ).length;
  const totalRoles = [...new Set(employees.map((employee) => employee.role))]
    .length;

  return (
    <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-300 min-h-screen">
      <div className="grid grid-cols-4 gap-8 mb-6">
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg text-center">
          <h3 className="text-2xl font-bold">{totalEmployees}</h3>
          <p className="text-sm">Total Employees</p>
        </div>
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg text-center">
          <h3 className="text-2xl font-bold">{totalPresent}</h3>
          <p className="text-sm">Total Present</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg text-center">
          <h3 className="text-2xl font-bold">{totalAbsent}</h3>
          <p className="text-sm">Total Absent</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded-lg shadow-lg text-center">
          <h3 className="text-2xl font-bold">{totalRoles}</h3>
          <p className="text-sm">Total Roles</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-9 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-left">
            Attendance for {formattedDate}
          </h2>
          <table className="w-full text-left border-separate border-spacing-0 text-gray-700 font-semibold">
            <thead className="bg-indigo-300">
              <tr>
                <th className="px-6 py-4 border-b-2 border-gray-200">
                  Employee
                </th>

                <th className="px-6 py-4 border-b-2 border-gray-200">
                  Contact
                </th>
                <th className="px-6 py-4 border-b-2 border-gray-200">Role</th>
                <th className="px-6 py-4 border-b-2 border-gray-200">Email</th>
                <th className="px-6 py-4 border-b-2 border-gray-200">Status</th>
                <th className="px-6 py-4 border-b-2 border-gray-200">View</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-4 text-red-500 font-semibold"
                  >
                    No Employee Found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-blue-100">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={employee.photo}
                        alt={employee.name}
                        className="rounded-full w-12 h-12"
                      />
                      {employee.name}
                    </td>

                    <td className="px-6 py-4">{employee.contact}</td>
                    <td className="px-6 py-4">{employee.role}</td>
                    <td className="px-6 py-4">{employee.email}</td>
                    <td className="px-6 py-4">
                      <label className="inline-flex relative items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employee.attendance === "Present"}
                          onChange={() =>
                            toggleAttendance(employee.id, employee.attendance)
                          }
                          className="sr-only"
                        />
                        <span
                          className={`w-11 h-6 rounded-full transition-colors duration-100 ${
                            employee.attendance === "Present"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          <span
                            className={`${
                              employee.attendance === "Present"
                                ? "translate-x-5"
                                : "translate-x-0"
                            } inline-block w-5 h-5 bg-white rounded-full transform transition-all`}
                          />
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(employee)}
                        className="bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {attendanceChanged && (
            <div className="mt-6 text-right">
              <button
                onClick={saveAttendance}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition duration-200"
              >
                Save Attendance
              </button>
            </div>
          )}
        </div>

        <div className="col-span-3">
          <button
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
          >
            <FontAwesomeIcon icon={faFilter} />
            {isFilterMenuOpen ? "Hide Filters" : "Show Filters"}
          </button>

          {isFilterMenuOpen && (
            <div className="bg-white p-6 mt-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-indigo-600 mb-4">
                Filters
              </h2>
              <div className="mb-4">
                <label className="block mb-2 text-gray-700 font-semibold">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border-2 border-indigo-300"
                >
                  <option value="All">All</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-700 font-semibold">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border-2 border-indigo-300"
                >
                  <option value="All">All</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Dailywages">Daily Wages</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-700 font-semibold">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border-2 border-indigo-300"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-700 font-semibold">
                  Contact
                </label>
                <input
                  type="text"
                  placeholder="Search by contact"
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border-2 border-indigo-300"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-700 font-semibold">
                  Date
                </label>
                <input
                  type="date"
                  value={filterDate.split(".").reverse().join("-") || ""}
                  onChange={(e) =>
                    setFilterDate(e.target.value.split("-").reverse().join("."))
                  }
                  className="w-full px-4 py-2 rounded-md border-2 border-indigo-300"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="monthlyFilter"
                    checked={monthlyFilter}
                    onChange={(e) => setMonthlyFilter(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-indigo-600"
                  />
                  <label htmlFor="monthlyFilter" className="text-gray-700">
                    Filter by Month
                  </label>
                </div>
              </div>
              <button
                onClick={handleFilters}
                className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition duration-200"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-blue-100 p-9 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex flex-col items-center">
              <img
                src={selectedEmployee.photo}
                alt={selectedEmployee.name}
                className="rounded-full w-24 h-20 mb-4"
              />
              <h3 className="text-3xl font-semibold mb-2">
                {selectedEmployee.name}
              </h3>
              <p className="text-lg font-semibold text-gray-500 mb-4">
                {selectedEmployee.role}
              </p>
            </div>

            <div className="space-y-4">
              <p>
                <strong>DOB:</strong> {selectedEmployee.dob}
              </p>
              <p>
                <strong>Email:</strong> {selectedEmployee.email}
              </p>
              <p>
                <strong>Contact:</strong> {selectedEmployee.contact}
              </p>
              <p>
                <strong>Status:</strong> {selectedEmployee.attendance}
              </p>
            </div>

            {isEditing ? (
              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  name="name"
                  value={editedEmployee.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Edit Name"
                />
                <input
                  type="date"
                  name="dob"
                  value={editedEmployee.dob}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Edit DOB"
                />
                <input
                  type="text"
                  name="contact"
                  value={editedEmployee.contact}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Edit Contact"
                />
                <input
                  type="email"
                  name="email"
                  value={editedEmployee.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Edit Email"
                />
                <input
                  type="text"
                  name="role"
                  value={editedEmployee.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Edit Role"
                />
                <div className="flex justify-around mt-4">
                  <button
                    onClick={saveEditedEmployee}
                    className="bg-blue-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex justify-around w-full">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-yellow-600"
                >
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button
                  onClick={closeModal}
                  className="bg-red-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faTimes} /> Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
