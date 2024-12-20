import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaCog } from "react-icons/fa";
import { AiOutlineMail, AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { Link } from "react-router-dom";

const Navbar = ({ handleMenuClick }) => {
  const [activeDropdown, setActiveDropdown] = useState(""); // Active dropdown state
  const [isFullScreen, setIsFullScreen] = useState(false); // Fullscreen toggle state
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toLocaleString()); // Date & Time state
  // const [activeLink, setActiveLink] = useState(""); // Active link state
  const [activeLink, setActiveLink] = useState("Dashboard");
  const navigate = useNavigate();

  const notifications = [
    { id: 1, message: "New user registered", time: "2 mins ago" },
    { id: 2, message: "System update available", time: "10 mins ago" },
  ];

  const mails = [
    { id: 1, subject: "Welcome to the platform!", time: "5 mins ago" },
    { id: 2, subject: "System downtime notice", time: "1 hour ago" },
  ];

  // Update date and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleNavigation = (path, linkName) => {
    setActiveLink(linkName); // Set the active link
    navigate(path);
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        toast.success("Logged out successfully!");
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error during logout:", error);
        toast.error("Error logging out. Please try again.");
      });
  };


  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <i
          className="bx bx-menu text-white cursor-pointer lg:hidden"
          onClick={handleMenuClick}
        ></i>
        <div className="text-2xl font-bold ml-4 lg:ml-0">Admin</div>
      </div>

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
                  <div key={mail.id} className="p-4 border-b hover:bg-gray-200 cursor-pointer">
                    <p className="font-medium">{mail.subject}</p>
                    <span className="text-xs text-gray-500">{mail.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile as Direct Link */}
        <div className="relative">
          <button
            onClick={() => handleNavigation("/profile", "Profile")}
            className="p-3 rounded-full hover:bg-gray-700"
          >
            <FaUserCircle size={24} />
          </button>
        </div>

        {/* Date and Time Display (in Two Rows) */}
        <div className="text-lg text-white ml-4 flex flex-col items-center">
          <p>{new Date().toLocaleDateString()}</p>
          <p>{new Date().toLocaleTimeString()}</p>
        </div>

         {/* Logout */}
         <li className={activeLink === "logout" ? "active" : ""}>
  <Link
    to="#"
    onClick={() => {
      handleLogout();
      handleLinkClick("logout");
    }}
    style={{
      color: "red",
      fontWeight: "bold",
      marginTop: "5px", // Fixed typo: "marginToptop" to "marginTop"
    }}
    className="flex items-center"
  >
    {/* Logout Icon */}
    <RiLogoutCircleRLine size={24} className="mr-2 hover:text-red-700 transition duration-200" />
    {/* Text */}
    <span className="p-3 rounded-full text-red-500"></span>
  </Link>
</li>
      </div>
    </nav>
  );
};

export default Navbar;
