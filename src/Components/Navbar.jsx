import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineMail,
  AiOutlineAppstore,
  AiOutlineFullscreen,
  AiOutlineFullscreenExit,
} from "react-icons/ai";
import {
  FaBell,
  FaSearch,
  FaUserCircle,
  FaTasks,
  FaQuestionCircle,
} from "react-icons/fa";
import { RiLogoutCircleRLine, RiHistoryLine } from "react-icons/ri";

const Navbar = ({ handleMenuClick }) => {
  const [activeDropdown, setActiveDropdown] = useState(""); // Keeps track of active dropdown
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // Profile menu controlled separately
  const [isFullScreen, setIsFullScreen] = useState(false); // Full-screen toggle state
  const navigate = useNavigate();

  const notifications = [
    { id: 1, message: "New user registered", time: "2 mins ago" },
    { id: 2, message: "System update available", time: "10 mins ago" },
  ];

  const mails = [
    { id: 1, subject: "Welcome to the platform!", time: "5 mins ago" },
    { id: 2, subject: "System downtime notice", time: "1 hour ago" },
  ];

  const toggleSearch = () => setIsSearchVisible(!isSearchVisible);

  const handleNavigation = (path) => {
    setIsProfileMenuOpen(false); // Close the profile menu after navigation
    navigate(path);
  };

  const handleLogout = () => {
    alert("You have been logged out.");
    setIsProfileMenuOpen(false); // Close the profile menu after logout
    navigate("/login");
  };

  // Full-Screen Toggle
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullScreen(!isFullScreen);
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
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
        {/* Full-Screen Control */}
        <button
          onClick={toggleFullScreen}
          className="p-3 rounded-full hover:bg-gray-700"
        >
          {isFullScreen ? (
            <AiOutlineFullscreenExit size={24} />
          ) : (
            <AiOutlineFullscreen size={24} />
          )}
        </button>

        {/* Search */}
        <button
          onClick={toggleSearch}
          className="p-3 rounded-full hover:bg-gray-700"
        >
          <FaSearch size={24} />
        </button>
        {isSearchVisible && (
          <div className="relative ml-4">
            <input
              type="text"
              placeholder="Search..."
              className="bg-gray-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Notifications */}
        <div
          className="relative"
          onMouseEnter={() => setActiveDropdown("notifications")}
          onMouseLeave={() => setActiveDropdown("")}
        >
          <button className="p-3 rounded-full hover:bg-gray-700">
            <FaBell size={24} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          {activeDropdown === "notifications" && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="font-semibold text-lg">Notifications</h3>
              </div>
              <div className="h-60 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b hover:bg-gray-200 cursor-pointer"
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

        {/* Mail */}
        <div
          className="relative"
          onMouseEnter={() => setActiveDropdown("mail")}
          onMouseLeave={() => setActiveDropdown("")}
        >
          <button className="p-3 rounded-full hover:bg-gray-700">
            <AiOutlineMail size={24} />
            {mails.length > 0 && (
              <span className="absolute top-0 right-0 bg-green-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center">
                {mails.length}
              </span>
            )}
          </button>
          {activeDropdown === "mail" && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="font-semibold text-lg">Mails</h3>
              </div>
              <div className="h-60 overflow-y-auto">
                {mails.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-4 border-b hover:bg-gray-200 cursor-pointer"
                  >
                    <p className="font-medium">{mail.subject}</p>
                    <span className="text-xs text-gray-500">{mail.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile (Click-Based Dropdown) */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="p-3 rounded-full hover:bg-gray-700"
          >
            <FaUserCircle size={24} />
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black rounded-lg shadow-lg w-48 z-50">
              <ul className="p-2">
                <li
                  className="py-2 px-4 hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleNavigation("/profile")}
                >
                  My Profile
                </li>

                <li
                  className="py-2 px-4 hover:bg-gray-200 cursor-pointer flex items-center"
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
