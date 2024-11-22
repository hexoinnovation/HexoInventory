import { useState } from "react";
import { Link } from "react-router-dom"; // Import Link from React Router

const Sidebar = ({ sidebarVisible, toggleSidebar }) => {
  const [activeLink, setActiveLink] = useState("Dashboard"); // Set 'Dashboard' as the default active link
  const [isEcommerceDropdownOpen, setIsEcommerceDropdownOpen] = useState(false);
  const [isHRMDropdownOpen, setIsHRMDropdownOpen] = useState(false);
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false); // State for Inventory dropdown

  // Handle link click and set active link
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

  // Toggle dropdown visibility on click
  const toggleEcommerceDropdown = () =>
    setIsEcommerceDropdownOpen(!isEcommerceDropdownOpen);
  const toggleHRMDropdown = () => setIsHRMDropdownOpen(!isHRMDropdownOpen);
  const toggleInventoryDropdown = () =>
    setIsInventoryDropdownOpen(!isInventoryDropdownOpen); // Toggle Inventory dropdown

  return (
    <section id="sidebar" className={sidebarVisible ? "" : "hide"}>
      {/* Sidebar Logo and Toggle Button for Mobile */}
      <div className="sidebar-header">
        <a href="#" className="brand">
          <i className="bx bxs-store-alt"></i>
          <span className="text">IMEX</span>
        </a>
      </div>

      {/* Sidebar menu */}
      <ul className="side-menu">
        <div className="dash">
          <li className={activeLink === "Dashboard" ? "active" : ""}>
            <Link to="/" onClick={() => handleLinkClick("Dashboard")}>
              <i className="bx bxs-dashboard"></i>
              <span className="text">Dashboard</span>
            </Link>
          </li>
        </div>
        {/* Inventory Dropdown (click to toggle) */}
        <li className="cursor-pointer" onClick={toggleInventoryDropdown}>
          <div className="label">
            <i className="bx bxs-package"></i>
            <span className="ml-2 font-extrabold">Inventory Menu</span>
            <i
              className={`bx ml-auto ${
                isInventoryDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"
              }`}
            ></i>
          </div>
        </li>

        {/* Dropdown Content for Inventory */}
        {isInventoryDropdownOpen && (
          <ul className="ml-4 space-y-2 mt-2">
            {/* Adding Purchase and Invoice Menu under Inventory */}
            <li className={activeLink === "purchase" ? "active" : ""}>
              <Link to="/purchase" onClick={() => handleLinkClick("purchase")}>
                <i className="bx bxs-cart"></i>
                <span className="text">Purchase</span>
              </Link>
            </li>
            <li className={activeLink === "Stock" ? "active" : ""}>
              <Link to="/Stock" onClick={() => handleLinkClick("Stock")}>
                <i className="bx bxs-package"></i>
                <span className="text">Stock</span>
              </Link>
            </li>
            <li className={activeLink === "sales" ? "active" : ""}>
              <Link to="/sales" onClick={() => handleLinkClick("sales")}>
                <i className="bx bxs-cart-alt"></i>
                <span className="text">Sales</span>
              </Link>
            </li>
            <li className={activeLink === "invoice" ? "active" : ""}>
              <Link to="/invoice" onClick={() => handleLinkClick("invoice")}>
                <i className="bx bxs-file"></i>
                <span className="text">Invoice</span>
              </Link>
            </li>
          </ul>
        )}

        {/* Ecommerce Dropdown (click to toggle) */}
        <li className="cursor-pointer" onClick={toggleEcommerceDropdown}>
          <div className="label">
            <i className="bx bxs-store-alt"></i>
            <span className="ml-2 font-extrabold">Ecommerce Menu</span>
            <i
              className={`bx ml-auto ${
                isEcommerceDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"
              }`}
            ></i>
          </div>
        </li>

        {/* Dropdown Content for Ecommerce */}
        {isEcommerceDropdownOpen && (
          <ul className="ml-4 space-y-2 mt-2">
            <li className={activeLink === "shop" ? "active" : ""}>
              <Link to="/shop" onClick={() => handleLinkClick("shop")}>
                <i className="bx bxs-store-alt"></i>
                <span className="text">Shop</span>
              </Link>
            </li>

            <li className={activeLink === "order" ? "active" : ""}>
              <Link to="/order" onClick={() => handleLinkClick("order")}>
                <i className="bx bxs-cart-add"></i>
                <span className="text">Order</span>
              </Link>
            </li>

            <li className={activeLink === "products" ? "active" : ""}>
              <Link to="/products" onClick={() => handleLinkClick("products")}>
                <i className="bx bxs-box"></i>
                <span className="text">Products</span>
              </Link>
            </li>

            <li className={activeLink === "categories" ? "active" : ""}>
              <Link
                to="/categories"
                onClick={() => handleLinkClick("categories")}
              >
                <i className="bx bxs-category"></i>
                <span className="text">Categories</span>
              </Link>
            </li>
          </ul>
        )}

        {/* HRM Section Dropdown (click to toggle) */}
        <li className="cursor-pointer" onClick={toggleHRMDropdown}>
          <div className="label">
            <i className="bx bxs-user-detail"></i>
            <span className="ml-2 font-extrabold">HRM Section</span>
            <i
              className={`bx ml-auto ${
                isHRMDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"
              }`}
            ></i>
          </div>
        </li>

        {/* Dropdown Content for HRM Section */}
        {isHRMDropdownOpen && (
          <ul className="ml-4 space-y-2 mt-2">
            <li className={activeLink === "employee" ? "active" : ""}>
              <Link to="/employee" onClick={() => handleLinkClick("employee")}>
                <i className="bx bxs-user"></i>
                <span className="text">Employee Details</span>
              </Link>
            </li>

            <li className={activeLink === "attendence" ? "active" : ""}>
              <Link
                to="/attendence"
                onClick={() => handleLinkClick("attendence")}
              >
                <i className="bx bxs-check-circle"></i>
                <span className="text">Attendance</span>
              </Link>
            </li>

            <li className={activeLink === "salary" ? "active" : ""}>
              <Link to="/salary" onClick={() => handleLinkClick("salary")}>
                <i className="bx bxs-wallet"></i>
                <span className="text">Salary</span>
              </Link>
            </li>
          </ul>
        )}

        {/* Logout Menu */}
        <li className={activeLink === "logout" ? "active" : ""}>
          <Link
            to="#"
            onClick={() => {
              handleLogout();
              handleLinkClick("logout");
            }}
            style={{ color: "red", fontWeight: "bold" }}
          >
            <i className="bx bx-log-out"></i>
            <span className="ml-2 font-extrabold">Logout</span>
          </Link>
        </li>

        {/* Help Menu */}
        <li>
          <Link to="/help">
            <i className="bx bxs-help-circle"></i>
            <span className="text">Help</span>
          </Link>
        </li>
      </ul>
    </section>
  );
};

export default Sidebar;
