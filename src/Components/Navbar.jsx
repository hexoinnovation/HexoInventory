import React, { useState, useRef } from "react";
import { AiOutlineDashboard } from "react-icons/ai"; // For Admin Dashboard link
import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";
import { FiUsers } from "react-icons/fi"; // For User Management icon

const Navbar = ({ handleMenuClick, isAdmin }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false); // State to toggle search bar visibility
  const [searchTerm, setSearchTerm] = useState(""); // State to store search input
  const menuBarRef = useRef(null); // Ref for the menu icon

  // Toggle the search visibility
  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible); // Toggle search visibility
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update the search term
  };

  // Toggle the dropdown menu (Profile, Logout, etc.)
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Open email client with predefined subject and body
  const handleEmailClick = () => {
    const email = "support@example.com"; // Replace with the actual email address
    const subject = "Support Request"; // Predefined subject
    const body = "Hello, I need assistance with..."; // Predefined body message
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl; // Opens the default email client
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md dark:bg-gray-900">
      {/* Menu Icon (Hamburger) */}
      <div className="flex items-center">
        <i
          ref={menuBarRef}
          className="bx bx-menu text-white cursor-pointer lg:hidden"
          onClick={handleMenuClick} // Trigger the sidebar toggle
        ></i>
        {/* Logo or Title */}
        <div className="text-xl font-bold ml-4 lg:ml-0">Admin</div>
      </div>

      {/* Navbar Links */}
      <div className="flex space-x-4 items-center">
        {/* Search Toggle Button */}
        <button
          onClick={toggleSearch}
          className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          <FaSearch size={20} />
        </button>

        {/* Search Bar (hidden by default, toggled via state) */}
        {isSearchVisible && (
          <div className="relative ml-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="bg-gray-700 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-400"
            />
          </div>
        )}

        {/* Notification */}
        <div className="relative">
          <button className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600">
            <FaBell size={20} />
          </button>
          <span className="absolute top-0 right-0 bg-red-600 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            <FaUserCircle size={20} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-lg w-48">
              <ul className="p-2">
                <li className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  My Profile
                </li>
                <li className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  Settings
                </li>
                <li className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Email Button */}
        <button
          onClick={handleEmailClick}
          className="p-2 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          <i className="bx bx-envelope text-white text-xl"></i>
        </button>
      </div>

      {/* Admin Controls (Only shown if isAdmin is true) */}
      {isAdmin && (
        <div className="flex items-center space-x-4 ml-4">
          <button className="text-2xl mr-2 text-gray-700 hover:text-blue-500">
            <AiOutlineDashboard />
            <span className="ml-1">Dashboard</span>
          </button>
          <button className="text-2xl mr-2 text-gray-700 hover:text-blue-500">
            <FiUsers />
            <span className="ml-1">Users</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
