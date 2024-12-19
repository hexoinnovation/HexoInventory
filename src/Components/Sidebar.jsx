import { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ sidebarVisible, toggleSidebar }) => {
  const [activeLink, setActiveLink] = useState("Dashboard");
  const [isEcommerceDropdownOpen, setIsEcommerceDropdownOpen] = useState(false);
  const [isHRMDropdownOpen, setIsHRMDropdownOpen] = useState(false);
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false);
  const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);

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

  const toggleEcommerceDropdown = () =>
    setIsEcommerceDropdownOpen(!isEcommerceDropdownOpen);
  const toggleHRMDropdown = () => setIsHRMDropdownOpen(!isHRMDropdownOpen);
  const toggleInventoryDropdown = () =>
    setIsInventoryDropdownOpen(!isInventoryDropdownOpen);
  const toggleInvoiceDropdown = () =>
    setIsInvoiceDropdownOpen(!isInvoiceDropdownOpen);

  return (
    <section id="sidebar" className={sidebarVisible ? "" : "hide print:hidden"}>
      <div className="sidebar-header">
        <a href="#" className="brand">
          <i className="bx bxs-store-alt"></i>
          <span className="text print:hidden">IMEX</span>
        </a>
      </div>

      <ul className="side-menu print:hidden">
        {/* Inventory Menu */}
        <li className="cursor-pointer" onClick={toggleInventoryDropdown}>
          <div className="label">
            <i className="bx bxs-package"></i>
            <span className="ml-2 font-extrabold">Inventory Menu</span>
            <i
              className={`bx ml-auto ${isInventoryDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"}`}
            ></i>
          </div>
        </li>
        {isInventoryDropdownOpen && (
          <ul className="ml-4 space-y-2 mt-2">
            <li className={activeLink === "Dashboard" ? "active" : ""}>
              <Link to="/" onClick={() => handleLinkClick("Dashboard")}>
                <i className="bx bxs-dashboard"></i>
                <span className="text">Dashboard</span>
              </Link>
            </li>
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
          </ul>
        )}

        {/* Invoice Menu */}
        <li className="cursor-pointer" onClick={toggleInvoiceDropdown}>
          <div className="label">
            <i className="bx bxs-file"></i>
            <span className="ml-2 font-extrabold">Invoice Menu</span>
            <i
              className={`bx ml-auto ${isInvoiceDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"}`}
            ></i>
          </div>
        </li>
        {isInvoiceDropdownOpen && (
          <ul className="ml-4 space-y-2 mt-2">
            <li className={activeLink === "Dashboard" ? "active" : ""}>
              <Link to="/invoicedashboard" onClick={() => handleLinkClick("Dashboard")}>
                <i className="bx bxs-dashboard"></i>
                <span className="text">Dashboard</span>
              </Link>
            </li>
            <li className={activeLink === "invoice" ? "active" : ""}>
              <Link to="/invoice" onClick={() => handleLinkClick("invoice")}>
                <i className="bx bxs-file"></i>
                <span className="text">Invoice Page</span>
              </Link>
            </li>
            <li className={activeLink === "CustomerDetails" ? "active" : ""}>
              <Link to="/CustomerDetails" onClick={() => handleLinkClick("CustomerDetails")}>
                <i className="bx bxs-user"></i>
                <span className="text">Customer-Details</span>
              </Link>
            </li>
            <li className={activeLink === "BusinessDetails" ? "active" : ""}>
              <Link to="/BusinessDetails" onClick={() => handleLinkClick("BusinessDetails")}>
                <i className="bx bxs-briefcase"></i>
                <span className="text">Business Details</span>
              </Link>
            </li>
            <li className={activeLink === "viewAllInvoice" ? "active" : ""}>
              <Link to="/viewAllInvoice" onClick={() => handleLinkClick("viewAllInvoice")}>
                <i className="bx bxs-file"></i>
                <span className="text">All Invoices</span>
              </Link>
            </li>
          </ul>
        )}

        {/* Ecommerce Admin Panel */}
        <li className="cursor-pointer" onClick={toggleEcommerceDropdown}>
          <div className="label">
            <i className="bx bxs-store-alt"></i>
            <span className="ml-2 font-extrabold">Ecommerce Admin Panel</span>
            <i
              className={`bx ml-auto ${isEcommerceDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"}`}
            ></i>
          </div>
        </li>
        {isEcommerceDropdownOpen && (
          <ul className="ml-4 space-y-2 mt-2">
            <li className={activeLink === "dashboard" ? "active" : ""}>
              <Link to="/ecomdashboard" onClick={() => handleLinkClick("dashboard")}>
                <i className="bx bxs-dashboard"></i>
                <span className="text">Dashboard</span>
              </Link>
            </li>
            <li className={activeLink === "manage-products" ? "active" : ""}>
              <Link to="/manageproducts" onClick={() => handleLinkClick("manage-products")}>
                <i className="bx bxs-box"></i>
                <span className="text">Manage Products</span>
              </Link>
            </li>
            <li className={activeLink === "manage-categories" ? "active" : ""}>
              <Link to="/managecategories" onClick={() => handleLinkClick("manage-categories")}>
                <i className="bx bxs-category"></i>
                <span className="text">Manage Categories</span>
              </Link>
            </li>
            <li className={activeLink === "orders" ? "active" : ""}>
              <Link to="/orders" onClick={() => handleLinkClick("orders")}>
                <i className="bx bxs-cart"></i>
                <span className="text">Orders</span>
              </Link>
            </li>
          </ul>
        )}

        {/* HRM Section */}
        <li className="cursor-pointer" onClick={toggleHRMDropdown}>
          <div className="label">
            <i className="bx bxs-user-detail"></i>
            <span className="ml-2 font-extrabold">HRM Section</span>
            <i
              className={`bx ml-auto ${isHRMDropdownOpen ? "bx-chevron-up" : "bx-chevron-down"}`}
            ></i>
          </div>
        </li>
        {isHRMDropdownOpen && (
          <ul className="ml-4 space-y-2 mt-2">
            <li className={activeLink === "hrmdashboard" ? "active" : ""}>
              <Link to="/hrmdashboard" onClick={() => handleLinkClick("hrmdashboard")}>
                <i className="bx bxs-dashboard"></i>
                <span className="text">Dashboard</span>
              </Link>
            </li>
            <li className={activeLink === "employee" ? "active" : ""}>
              <Link to="/employee" onClick={() => handleLinkClick("employee")}>
                <i className="bx bxs-user"></i>
                <span className="text">Employee Details</span>
              </Link>
            </li>
            <li className={activeLink === "attendence" ? "active" : ""}>
              <Link to="/attendence" onClick={() => handleLinkClick("attendence")}>
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

        {/* Reports */}
        <li className="cursor-pointer">
          <Link to="/report">
            <i className="bx bxs-report text-2xl"></i>
            <span className="ml-2 font-extrabold text-yellow-100">Reports</span>
          </Link>
        </li>

        {/* Logout */}
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

        {/* Help */}
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
