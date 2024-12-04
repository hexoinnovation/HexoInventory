import React, { useEffect, useState } from "react";
import { collection, getDocs,getDoc , doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaShoppingCart } from "react-icons/fa";
import { auth, db } from "../config/firebase";
import Swal from "sweetalert2";
import DownloadInvoice from "../Components/DownloadInvoice";
import { jsPDF } from "jspdf";
import { IoIosCloseCircle } from 'react-icons/io';

const Sales = () => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [filters, setFilters] = useState({
    Bno: "",
    cname: "",
    pname: "",
  });
  const [user] = useAuthState(auth);
  const [stockData, setStockData] = useState([]);
  // Fetch data from Firestore
useEffect(() => {
  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch invoices
      const userDocRef = doc(db, "admins", user.email);
      
      // Fetch invoices
      const invoiceRef = collection(userDocRef, "Invoices");
      const invoiceSnapshot = await getDocs(invoiceRef);
      const invoices = invoiceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch stock data
      const stockRef = collection(userDocRef, "Stock");
      const stockSnapshot = await getDocs(stockRef);
      const stock = stockSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Set the data in state
      setInvoiceData(invoices);
      setStockData(stock);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  fetchData();
}, [user]);

  // Filter the data based on user input
  const filteredInvoiceData = invoiceData.filter(
    (invoice) =>
      invoice.invoiceNumber &&
      invoice.invoiceNumber.toString().includes(filters.Bno) &&
      invoice.billTo?.name &&
      invoice.billTo.name.toLowerCase().includes(filters.cname.toLowerCase())
  );

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const handleViewInvoice = async (invoiceNumber) => {
    try {
      // Fetch the specific invoice from Firestore
      const invoiceRef = doc(
        db,
        "admins",
        auth.currentUser.email, // Ensure that the user is authenticated
        "Invoices",
        invoiceNumber.toString()
      );
      const invoiceSnap = await getDoc(invoiceRef);

      if (invoiceSnap.exists()) {
        const invoiceData = invoiceSnap.data();
        setSelectedInvoice(invoiceData);
        setIsPopupOpen(true); // Open the popup when invoice is fetched
      } else {
        throw new Error("Invoice does not exist.");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      Swal.fire("Error!", "Failed to fetch the invoice data.", "error");
    }
  };

  const handleClosePopup = () => {
  setIsPopupOpen(false);
};

  const handleDownloadInvoice = async () => {
    try {
      if (selectedInvoice) {
        const pdf = await DownloadInvoice(selectedInvoice);
        setIsPopupOpen(false); // Close popup after download
      }
    } catch (error) {
      console.error("Error calling DownloadInvoice:", error);
      Swal.fire("Error!", "Failed to download the invoice.", "error");
    }
  };

  // Compute summary information for the infobox
  const totalSales = invoiceData.reduce(
    (acc, invoice) =>
      acc +
      (invoice.products || []).reduce(
        (prodAcc, product) =>
          prodAcc + (product.price || 0) * (product.quantity || 0),
        0
      ),
    0
  );
  const totalInvoices = invoiceData.length;

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-6 flex items-center">
        Sales Management
        <FaShoppingCart className="animate-drift ml-4" />
      </h1>

      {/* Infobox Section */}
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Sales Card */}
        <div className="p-6 bg-gradient-to-br from-blue-900 to-blue-900 text-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Total Sales</h3>
          <p className="text-3xl font-bold mt-2">₹{totalSales.toFixed(2)}</p>
        </div>

        {/* Total Invoices Card */}
        <div className="p-6 bg-gradient-to-br from-green-700 to-green-700 text-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Total Invoices</h3>
          <p className="text-3xl font-bold mt-2">{totalInvoices}</p>
        </div>

        {/* Total Products Sold Card */}
        <div className="p-6 bg-gradient-to-br from-purple-700 to-purple-700 text-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Total Products Sold</h3>
          <p className="text-3xl font-bold mt-2">
            {invoiceData.reduce(
              (total, invoice) =>
                total +
                (invoice.products || []).reduce(
                  (sum, product) => sum + (product.quantity || 0),
                  0
                ),
              0
            )}
          </p>
        </div>

        {/* Average Sales Card (Example) */}
        <div className="p-6 bg-gradient-to-br from-orange-700 to-orange-700 text-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Average Sales per Invoice</h3>
          <p className="text-3xl font-bold mt-2">
            ₹{(totalInvoices > 0 ? totalSales / totalInvoices : 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-blue-700 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="Bno"
              className="text-white block mb-1 font-semibold"
            >
              Bill Number
            </label>
            <input
              type="text"
              id="Bno"
              name="Bno"
              value={filters.Bno}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, Bno: e.target.value }))
              }
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Bill No."
            />
          </div>
          <div>
            <label
              htmlFor="cname"
              className="text-white block mb-1 font-semibold"
            >
              Customer Name
            </label>
            <input
              type="text"
              id="cname"
              name="cname"
              value={filters.cname}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, cname: e.target.value }))
              }
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Customer Name"
            />
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gradient-to-r from-blue-700 to-blue-700 text-white">
            <tr>
              <th className="py-3 px-4 text-left">UID</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Client</th>
              <th className="py-3 px-4 text-left">Product Name</th>
              <th className="py-3 px-4 text-left">quantity</th>
              <th className="py-3 px-4 text-left">Total Amount</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoiceData.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-100">
                <td className="py-3 px-4">{invoice.invoiceNumber}</td>
                <td className="py-3 px-4">
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">{invoice.billTo?.name || "N/A"}</td>
                <td className="py-3 px-4">
                  {(invoice.products || [])
                    .map((product) => product.description || "N/A")
                    .join(", ")}
                </td>
                <td className="py-3 px-4">
                  {(invoice.products || []).reduce(
                    (acc, product) => acc + (product.quantity || 0),
                    0
                  )}
                </td>
                <td className="py-3 px-4">
                  ₹
                  {(
                    (invoice.products || []).reduce(
                      (acc, product) =>
                        acc + (product.price || 0) * (product.quantity || 0),
                      0
                    ) || 0
                  ).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                <button
        onClick={() => handleViewInvoice(invoice.invoiceNumber)}
        className="bg-blue-900 text-white py-1 px-3 rounded-md"
      >
        View
      </button>
      {isPopupOpen && selectedInvoice && (
      <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-4">Invoice Details</h2>
          <button
            onClick={handleClosePopup}
            className="absolute top-5 right-7 text-white hover:text-gray-300"
          >
            <IoIosCloseCircle size={30} />
          </button>

          {/* Render Invoice Data in Popup */}
          <div>
            <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
            <p><strong>Date:</strong> {selectedInvoice.invoiceDate}</p>
            <p><strong>Bill From:</strong> {selectedInvoice.billFrom?.businessName}</p>
            <p><strong>Bill To:</strong> {selectedInvoice.billTo?.name}</p>
            <p><strong>Total Amount:</strong> ₹{selectedInvoice.totalAmount || 0}</p>
          </div>
        </div>
      </div>
    )}
 
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
