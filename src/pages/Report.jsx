import React, { useState, useEffect } from "react";
import {
  FaShoppingCart,
  FaStore,
  FaUsers,
  FaDownload,
  FaFileInvoice,
  FaClipboardList,
} from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Reusable Table Component
const DataTable = ({ fields, data }) => (
  <table className="min-w-full table-auto border-collapse">
    <thead className="bg-blue-900 text-white">
      <tr>
        {fields.map((field) => (
          <th key={field} className="py-3 px-4 text-left border-b">
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((item, index) => (
        <tr key={index} className="hover:bg-gray-100 transition duration-300">
          {fields.map((field) => (
            <td key={field} className="py-3 px-4 border-b">
              {item[field]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const ReportTabs = () => {
  const [activeTab, setActiveTab] = useState("purchase");
  const [data, setData] = useState({
    purchase: [],
    sales: [],
    stock: [],
    invoices: [],
    hrm: [],
    attendance: [],
    salaryemp: [],
    empdetails: [],
    businesses: [],
    customers: [],
  });
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    searchQuery: "",
    startDate: "",
    endDate: "",
    category: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(true); // Loading state
  const currentUser = auth.currentUser;

  // Report Fields Configuration
  const customFields = {
    purchase: ["no", "sname", "phone", "pname", "price"],
    sales: ["no", "pname", "phone", "sales", "price"],
    stock: ["no", "pname", "phone", "estock", "price"],
    invoices: ["invoiceNumber", "total", "paymentStatus", "invoiceDate"],
    attendance: [
      "name",
      "contact",
      "email",
      "date",
      "status"
    ],
    salaryemp: ["name", "contact", "role", "presentCount", "absentCount","date","Netsalary"],
    empdetails: [
      "name",
      "contact",
      "dob",
      "gender",
      "role",
      "salary",
      "salaryInterval",
    ],
    businesses: [
      "businessName",
      "registrationNumber",
      "contactNumber",
      "gstNumber",
      "city",
      "state",
    ],
    customers: ["name", "city", "phone", "aadhaar", "email", "panno"],
  };

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      const collections = [
        "Purchase",
        "Purchase",
        "Purchase",
        "Invoices",
        "Attendance",
        "Salaryemp",
        "Empdetails",
        "Businesses",
        "Customers",
      ];
      const newData = {};

      setLoading(true); // Start loading

      try {
        for (const collectionName of collections) {
          const collectionRef = collection(
            db,
            "admins",
            currentUser.email,
            collectionName
          );
          const snapshot = await getDocs(collectionRef);
          newData[collectionName.toLowerCase()] = snapshot.docs.map((doc) =>
            doc.data()
          );
        }
        setData(newData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } 
    };

    fetchData();
  }, [currentUser]);

  // Apply filters to the data
  useEffect(() => {
    const filterData = () => {
      const { searchQuery, startDate, endDate, category } = filters;
      const activeData = data[activeTab];

      if (!activeData) return;

      const filtered = activeData.filter((item) => {
        const matchesSearch = JSON.stringify(item)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesDateRange =
          (!startDate || new Date(item.date) >= new Date(startDate)) &&
          (!endDate || new Date(item.date) <= new Date(endDate));
        const matchesCategory = !category || item.category === category;

        return matchesSearch && matchesDateRange && matchesCategory;
      });

      setFilteredData(filtered);
    };

    filterData();
  }, [filters, data, activeTab]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination({ currentPage: 1, itemsPerPage: 10 });
    setFilters({
      searchQuery: "",
      startDate: "",
      endDate: "",
      category: "",
    });
  };

  // Pagination logic
  const indexOfLastItem = pagination.currentPage * pagination.itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - pagination.itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / pagination.itemsPerPage);

  const handlePageChange = (pageNum) => {
    setPagination({ ...pagination, currentPage: pageNum });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      searchQuery: "",
      startDate: "",
      endDate: "",
      category: "",
    });
  };

  // Export filtered data to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "report.xlsx");
  };

  // Export filtered data to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumns = Object.keys(filteredData[0]);
    const tableRows = filteredData.map((item) => Object.values(item));

    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
    });

    doc.save("report.pdf");
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8 p-6 sm:p-8 bg-gradient-to-r from-blue-900 to-blue-900">
        <FaShoppingCart className="text-4xl text-white" />
        <h1 className="text-3xl font-extrabold text-white">
          Reports Dashboard
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-grow">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Reports</h2>
          <div className="space-y-4">
            {[
              "purchase",
              "sales",
              "stock",
              "invoices",
              "attendance",
              "salaryemp",
              "empdetails",
              "businesses",
              "customers",
            ].map((tab) => (
              <button
                key={tab}
                className={`flex items-center px-6 py-3 w-full text-lg rounded-lg hover:bg-indigo-100 ${
                  activeTab === tab ? "bg-blue-900 text-white" : "text-gray-800"
                }`}
                onClick={() => handleTabChange(tab)}
              >
                <span className="mr-3 text-xl">
                  {tab === "purchase" ? (
                    <FaShoppingCart />
                  ) : tab === "sales" ? (
                    <FaStore />
                  ) : tab === "empdetails" ? (
                    <FaUsers />
                  ) : (
                    <FaClipboardList />
                  )}
                </span>
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-grow p-6 bg-white shadow-md rounded-lg">
          {/* Filters */}
          <div className="flex items-center justify-between mb-6 space-x-4">
            <div className="flex items-center space-x-4 flex-grow">
              <input
                type="text"
                placeholder="Search records"
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters({ ...filters, searchQuery: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-md w-full sm:w-1/3"
              />
              <input
                type="date"
                name="start"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="ml-4 p-2 border border-gray-300 rounded-md"
              />
              <span className="mx-2">to</span>
              <input
                type="date"
                name="end"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="p-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-red-700 text-white rounded-md hover:bg-gray-600"
            >
              Reset Filters
            </button>
          </div>

          {/* Loading state with spinner */}
          {/* {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <> */}
              {/* Download Buttons */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={exportToExcel}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                >
                  <FaDownload className="mr-2" /> Download Excel
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                >
                  <FaDownload className="mr-2" /> Download PDF
                </button>
              </div>

              {/* Data Display */}
              <div className="overflow-x-auto bg-white shadow-xl rounded-lg mb-6">
                {filteredData.length > 0 ? (
                  <DataTable
                    fields={customFields[activeTab]}
                    data={filteredData}
                  />
                ) : (
                  <p>No data available for this tab.</p>
                )}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md"
                >
                  Previous
                </button>
                <span className="mx-4">
                  {pagination.currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md"
                >
                  Next
                </button>
              </div>
            
          
        </div>
      </div>
    </div>
  );
};

export default ReportTabs;
