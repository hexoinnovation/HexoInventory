import React, { useState } from "react";

const Attendance = () => {
  // Sample data for employees
  const initialEmployees = [
    {
      id: 1,
      name: "John Doe",
      position: "Developer",
      date: "2024-11-18",
      time: "09:00 AM",
      status: "Present",
    },
    {
      id: 2,
      name: "Jane Smith",
      position: "Designer",
      date: "2024-11-18",
      time: "09:15 AM",
      status: "Late",
    },
    {
      id: 3,
      name: "David Johnson",
      position: "Manager",
      date: "2024-11-18",
      time: "08:45 AM",
      status: "Present",
    },
    {
      id: 4,
      name: "Sophie Turner",
      position: "HR",
      date: "2024-11-18",
      time: "09:00 AM",
      status: "Absent",
    },
  ];

  const [employees, setEmployees] = useState(initialEmployees);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  // Toggle attendance status
  const toggleAttendance = (employeeId) => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              status: employee.status === "Present" ? "Absent" : "Present",
            }
          : employee
      )
    );
  };

  // Handle Search Filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "status") setFilterStatus(value);
    if (name === "date") setFilterDate(value);
  };

  // Filtered employees based on search criteria
  const filteredEmployees = employees.filter((employee) => {
    const matchesStatus =
      filterStatus === "All" || employee.status === filterStatus;
    const matchesDate = !filterDate || employee.date.includes(filterDate);
    return matchesStatus && matchesDate;
  });

  return (
    <div className="container mx-auto p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <h1 className="text-4xl font-extrabold mb-8">Employee Attendance</h1>

      {/* Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <select
          name="status"
          value={filterStatus}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ease-in-out duration-150"
        >
          <option value="All">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
        </select>

        <input
          type="date"
          name="date"
          value={filterDate}
          onChange={handleFilterChange}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ease-in-out duration-150"
        />
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                Position
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                Time
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr
                key={employee.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ease-in-out duration-150"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {employee.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {employee.position}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {employee.date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {employee.time}
                </td>
                <td className="px-6 py-4 text-sm">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={employee.status === "Present"}
                      onChange={() => toggleAttendance(employee.id)}
                      className="form-checkbox h-6 w-6 text-blue-500 rounded focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition ease-in-out duration-150"
                    />
                    <span className="ml-2">{employee.status}</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
