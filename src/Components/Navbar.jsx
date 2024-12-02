import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineDashboard,
  AiOutlineMail,
  AiOutlineBarChart,
  AiOutlineAppstore,
} from "react-icons/ai";
import {
  FaBell,
  FaSearch,
  FaUserCircle,
  FaFileAlt,
  FaQuestionCircle,
  FaTasks,
} from "react-icons/fa";
import { FiUsers, FiSettings } from "react-icons/fi";
import { RiLogoutCircleRLine, RiHistoryLine } from "react-icons/ri";

const Navbar = ({ handleMenuClick, isAdmin }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New user registered", time: "2 mins ago" },
    { id: 2, message: "System update available", time: "10 mins ago" },
  ]);
  const [mails, setMails] = useState([
    { id: 1, subject: "Welcome to the platform!", time: "5 mins ago" },
    { id: 2, subject: "System downtime notice", time: "1 hour ago" },
  ]);
  const navigate = useNavigate();

  const toggleSearch = () => setIsSearchVisible(!isSearchVisible);
  const toggleNotifications = () =>
    setIsNotificationsOpen(!isNotificationsOpen);
  const toggleMail = () => setIsMailOpen(!isMailOpen);
  const toggleQuickLinks = () => setIsQuickLinksOpen(!isQuickLinksOpen);

  const handleNavigation = (path) => navigate(path);

  const handleLogout = () => {
    alert("You have been logged out.");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md dark:bg-gray-900">
      {/* Menu Icon */}
      <div className="flex items-center">
        <i
          className="bx bx-menu text-white cursor-pointer lg:hidden"
          onClick={handleMenuClick}
        ></i>
        <div className="text-2xl font-bold ml-4 lg:ml-0">Admin</div>
      </div>

      {/* Navbar Links */}
      <div className="flex space-x-6 items-center">
        {/* Search Toggle */}
        <button
          onClick={toggleSearch}
          className="p-3 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          <FaSearch size={24} />
        </button>

        {isSearchVisible && (
          <div className="relative ml-4">
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-400"
            />
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-3 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            <FaBell size={24} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="font-semibold text-lg">Notifications</h3>
              </div>
              <div className="h-60 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <p className="text-sm">{notification.message}</p>
                    <span className="text-xs text-gray-500">
                      {notification.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mail Dropdown */}
        <div className="relative">
          <button
            onClick={toggleMail}
            className="p-3 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            <AiOutlineMail size={24} />
            {mails.length > 0 && (
              <span className="absolute top-0 right-0 bg-green-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
                {mails.length}
              </span>
            )}
          </button>

          {isMailOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="font-semibold text-lg">Mails</h3>
              </div>
              <div className="h-60 overflow-y-auto">
                {mails.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-4 border-b dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <p className="font-medium">{mail.subject}</p>
                    <span className="text-xs text-gray-500">{mail.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links Dropdown */}
        <div className="relative">
          <button
            onClick={toggleQuickLinks}
            className="p-3 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            <AiOutlineAppstore size={24} />
          </button>

          {isQuickLinksOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="font-semibold text-lg">Quick Links</h3>
              </div>
              <ul className="p-2 space-y-2">
                <li
                  onClick={() => handleNavigation("/tasks")}
                  className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded"
                >
                  <FaTasks className="inline-block mr-2" /> Task Manager
                </li>
                <li
                  onClick={() => handleNavigation("/activity-log")}
                  className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded"
                >
                  <RiHistoryLine className="inline-block mr-2" /> Activity Log
                </li>
                <li
                  onClick={() => handleNavigation("/support")}
                  className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded"
                >
                  <FaQuestionCircle className="inline-block mr-2" /> Support
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-3 rounded-full hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            <FaUserCircle size={24} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black dark:bg-gray-800 dark:text-white rounded-lg shadow-lg w-48 z-50">
              <ul className="p-2">
                <li
                  className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleNavigation("/profile")}
                >
                  My Profile
                </li>
                <li
                  className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleNavigation("/account-settings")}
                >
                  Account Settings
                </li>
                <li
                  className="py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  onClick={handleLogout}
                >
                  <RiLogoutCircleRLine className="mr-2" /> Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
