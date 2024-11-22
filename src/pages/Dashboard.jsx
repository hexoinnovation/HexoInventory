import { Link } from "react-router-dom";
import TodoList from "../Components/Todolist";

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

const Dashboard = () => {
  // WhatsApp click handler
  const handleWhatsAppClick = () => {
    const phoneNumber = "+1234567890"; // Replace with your actual phone number
    const message = "Hello, I need assistance."; // Predefined message
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank"); // Opens WhatsApp Web in a new tab
  };

  return (
    <main className="bg-white-600 text-gray-100 min-h-screen p-8">
      {/* Header Title */}
      <div className="head-title flex justify-between items-center mb-12 bg-gradient-to-r from-blue-900 to-indigo-800 p-8 rounded-2xl shadow-2xl">
        <div className="left">
          <h1 className="text-5xl font-bold text-white">Dashboard</h1>
          <ul className="breadcrumb flex space-x-3 text-sm text-white-400">
            <li>
              <a href="#" className="text-white hover:text-blue-400">
                Dashboard
              </a>
            </li>
            <li>
              <i className="bx bx-chevron-right text-gray-400"></i>
            </li>
            <li>
              <a href="#" className="text-white hover:text-blue-400">
                Home
              </a>
            </li>
          </ul>
        </div>
        <a
          href="#"
          className="btn-download flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 transition duration-300"
        >
          <i className="bx bxs-cloud-download"></i>
          <span className="ml-3">Download PDF</span>
        </a>
      </div>

      {/* Info Boxes for Inventory, E-commerce, HRM */}
      <ul className="box-info grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* Inventory Info Box */}
        <li>
          <InfoBox
            title="Inventory"
            value="I1200"
            description="Total Items in Stock"
            color="from-blue-800 via-blue-900 to-indigo-800"
          />
        </li>

        {/* E-commerce Info Box */}
        <li>
          <InfoBox
            title="E-commerce Sales"
            value="$5400"
            description="Total Sales this Month"
            color="from-blue-600 via-blue-700 to-blue-800"
          />
        </li>

        {/* HRM Info Box */}
        <li>
          <InfoBox
            title="Employees"
            value="E-350"
            description="Total Employees"
            color="from-indigo-800 via-indigo-900 to-indigo-700"
          />
        </li>
      </ul>

      {/* Control Sections for Inventory, E-commerce, HRM, Analytics, Reports, User Management */}
      <div className="dashboard-controls grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* Inventory Control */}
        <div className="control-card p-6 bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-800 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">
            Inventory Management
          </h3>
          <p className="text-gray-100">
            Manage stock, orders, and product details
          </p>
          <Link
            to="/inventory"
            className="btn btn-primary mt-4 text-white bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Manage Inventory
          </Link>
        </div>

        {/* E-commerce Control */}
        <div className="control-card p-6 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">E-commerce</h3>
          <p className="text-gray-100">
            Track products, orders, and customer data
          </p>
          <Link
            to="/e-commerce"
            className="btn btn-primary mt-4 text-white bg-blue-500 px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Manage E-commerce
          </Link>
        </div>

        {/* HRM Control */}
        <div className="control-card p-6 bg-gradient-to-r from-blue-900 via-indigo-800 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">HRM System</h3>
          <p className="text-gray-100">
            Manage employees, payroll, and attendance
          </p>
          <Link
            to="/hrm"
            className="btn btn-primary mt-4 text-white bg-indigo-700 px-6 py-2 rounded-lg hover:bg-indigo-800 transition"
          >
            Manage HRM
          </Link>
        </div>

        {/* Analytics Control */}
        <div className="control-card p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">Analytics</h3>
          <p className="text-gray-100">View detailed analytics and reports</p>
          <Link
            to="/analytics"
            className="btn btn-primary mt-4 text-white bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            View Analytics
          </Link>
        </div>

        {/* Reports Control */}
        <div className="control-card p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">Reports</h3>
          <p className="text-gray-100">
            Generate sales, inventory, and HR reports
          </p>
          <Link
            to="/reports"
            className="btn btn-primary mt-4 text-white bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Generate Reports
          </Link>
        </div>

        {/* User Management Control */}
        <div className="control-card p-6 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">User Management</h3>
          <p className="text-gray-100">
            Manage user roles, permissions, and access
          </p>
          <Link
            to="/user-management"
            className="btn btn-primary mt-4 text-white bg-indigo-700 px-6 py-2 rounded-lg hover:bg-indigo-800 transition"
          >
            Manage Users
          </Link>
        </div>

        {/* Settings Control */}
        <div className="control-card p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">Settings</h3>
          <p className="text-gray-100">
            Configure system preferences and settings
          </p>
          <Link
            to="/settings"
            className="btn btn-primary mt-4 text-white bg-indigo-600 px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            System Settings
          </Link>
        </div>
      </div>

      {/* Todo List Section */}
      <div className="table-data bg-gradient-to-r from-blue-600  p-8 rounded-2xl shadow-lg mb-16">
        <h3 className="text-xl font-semibold text-gray-100 mb-6">
          Recent Orders
        </h3>
        <TodoList />
      </div>

      {/* WhatsApp Chat Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleWhatsAppClick}
          className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition duration-300"
        >
          <i className="bx bxl-whatsapp text-3xl"></i>
        </button>
      </div>
    </main>
  );
};

export default Dashboard;
