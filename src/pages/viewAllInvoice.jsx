import React, { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete, AiOutlineClose } from "react-icons/ai";
import { auth, db } from "../config/firebase";
import { FaFileInvoice } from "react-icons/fa6";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ViewAllInvoice = () => {
  const [user] = useAuthState(auth);
  const [invoiceData, setInvoiceData] = useState([]);
  const [filteredInvoiceData, setFilteredInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [filter, setFilter] = useState({
    paymentStatus: "",
    startDate: "",
    endDate: "",
    specificDate: "",
    customerName: "",
    invoiceNumber: "",
  });

  useEffect(() => {
    if (user?.email) {
      fetchInvoices();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [filter, invoiceData]);

  const fetchInvoices = async () => {
    try {
      const invoicesRef = collection(db, "admins", user.email, "Invoices");
      const querySnapshot = await getDocs(invoicesRef);

      const invoices = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setInvoiceData(invoices);
      setFilteredInvoiceData(invoices);

      const paid = invoices.filter(
        (invoice) => invoice.paymentStatus === "Paid"
      ).length;
      const unpaid = invoices.filter(
        (invoice) => invoice.paymentStatus === "Unpaid"
      ).length;

      setPaidCount(paid);
      setUnpaidCount(unpaid);

      const total = invoices.reduce((acc, invoice) => {
        const invoiceTotal = (invoice.products || []).reduce(
          (productAcc, product) => productAcc + (product.total || 0),
          0
        );
        return acc + invoiceTotal;
      }, 0);

      setTotalAmount(total);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to fetch invoices. Please try again.",
      });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prevFilter) => {
      const updatedFilter = { ...prevFilter, [name]: value };
      applyFilter(updatedFilter);
      return updatedFilter;
    });
  };

  const applyFilter = (newFilter = filter) => {
    let filteredData = [...invoiceData];

    if (newFilter.paymentStatus) {
      filteredData = filteredData.filter(
        (item) =>
          item.paymentStatus?.toLowerCase() ===
          newFilter.paymentStatus.toLowerCase()
      );
    }

    if (newFilter.customerName) {
      filteredData = filteredData.filter((item) =>
        item.billTo?.name
          ?.toLowerCase()
          .includes(newFilter.customerName.toLowerCase())
      );
    }

    if (newFilter.startDate) {
      filteredData = filteredData.filter(
        (item) => new Date(item.invoiceDate) >= new Date(newFilter.startDate)
      );
    }

    if (newFilter.endDate) {
      filteredData = filteredData.filter(
        (item) => new Date(item.invoiceDate) <= new Date(newFilter.endDate)
      );
    }

    if (newFilter.specificDate) {
      filteredData = filteredData.filter(
        (item) =>
          new Date(item.invoiceDate).toDateString() ===
          new Date(newFilter.specificDate).toDateString()
      );
    }

    if (newFilter.invoiceNumber) {
      filteredData = filteredData.filter((item) =>
        item.invoiceNumber.toString().includes(newFilter.invoiceNumber)
      );
    }

    setFilteredInvoiceData(filteredData);
  };

  const handleDeleteInvoice = async (invoiceNumber) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won’t be able to undo this action!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        const invoiceDocRef = doc(
          db,
          "admins",
          user.email,
          "Invoices",
          invoiceNumber.toString()
        );

        await deleteDoc(invoiceDocRef);

        setInvoiceData((prevInvoices) =>
          prevInvoices.filter(
            (invoice) => invoice.invoiceNumber !== invoiceNumber
          )
        );

        Swal.fire(
          "Deleted!",
          `Invoice ${invoiceNumber} has been deleted.`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      Swal.fire("Error!", "Failed to delete the invoice.", "error");
    }
  };

  const handleViewInvoice = async (invoiceNumber) => {
    try {
      const invoiceRef = doc(
        db,
        "admins",
        auth.currentUser.email,
        "Invoices",
        invoiceNumber.toString()
      );
      const invoiceSnap = await getDoc(invoiceRef);

      if (invoiceSnap.exists()) {
        const invoiceData = invoiceSnap.data();
        setSelectedInvoice(invoiceData);
        setIsPopupOpen(true);
      } else {
        throw new Error("Invoice does not exist.");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      Swal.fire("Error!", "Failed to fetch the invoice data.", "error");
    }
  };

  const handlePrint = () => {
    if (!selectedInvoice) {
      console.error("No invoice selected for printing.");
      return;
    }

    const content = document.getElementById("popup-modal");

    html2canvas(content, {
      scale: 2,
      useCORS: true,
    }).then((canvas) => {
      const doc = new jsPDF();
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, 180, 0);
      doc.save(`invoice-${selectedInvoice.invoiceNumber}.pdf`);
    });
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedInvoice(null);
  };

  const calculateGST = (price, quantity) => {
    const gstRate = 0.18; // Assuming 18% GST
    return (price * quantity * gstRate).toFixed(2);
  };

  const calculateTotalAmount = () => {
    let totalAmount = 0;
    let totalGST = 0;

    selectedInvoice?.products.forEach((product) => {
      const productTotal = product.price * product.quantity;
      const gstAmount = calculateGST(product.price, product.quantity);

      totalAmount += productTotal;
      totalGST += parseFloat(gstAmount);
    });

    return { totalAmount, totalGST, finalAmount: totalAmount + totalGST };
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      <h1 className="text-5xl font-extrabold text-blue-700 mb-6 flex items-center">
        All Invoices
        <FaFileInvoice className="ml-4 animate-pulseSpin" />
      </h1>

      {/* Info Boxes */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-6 bg-blue-600 text-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Paid Count</h3>
          <p className="text-4xl">{paidCount}</p>
        </div>
        <div className="p-6 bg-green-600 text-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Unpaid Count</h3>
          <p className="text-4xl">{unpaidCount}</p>
        </div>
        <div className="p-6 bg-red-600 text-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Total Amount</h3>
          <p className="text-4xl">₹{totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-blue-900 p-4 rounded-md shadow-md mb-6">
        <h2 className="text-lg font-bold text-gray-100 mb-4">
          Filter Invoices
        </h2>
        <div className="grid grid-cols-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Payment Status */}
          <div>
            <label htmlFor="paymentStatus" className="font-bold text-gray-100">
              Payment Status:
            </label>
            <select
              name="paymentStatus"
              value={filter.paymentStatus}
              onChange={handleFilterChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className="font-bold text-gray-100">
              Customer Name:
            </label>
            <input
              type="text"
              name="customerName"
              value={filter.customerName}
              onChange={handleFilterChange}
              placeholder="Customer Name"
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Specific Date */}
          <div>
            <label htmlFor="specificDate" className="font-bold text-gray-100">
              Specific Date:
            </label>
            <input
              type="date"
              name="specificDate"
              value={filter.specificDate}
              onChange={handleFilterChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoiceNumber" className="font-bold text-gray-100">
              Invoice Number:
            </label>
            <input
              type="text"
              name="invoiceNumber"
              value={filter.invoiceNumber}
              onChange={handleFilterChange}
              placeholder="Invoice Number"
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Filter Button */}
          <div className="flex items-end">
            <button
              onClick={applyFilter}
              className="py-3 px-6 w-full bg-green-500 text-white rounded-md hover:bg-blue-600"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <table className="min-w-full bg-white rounded-lg shadow-md">
        <thead className="bg-blue-900 text-white">
          <tr>
            <th className="py-3 px-4 text-left ">UID</th>
            <th className="py-3 px-4 text-left ">Client</th>
            <th className="py-3 px-4 text-left ">Email</th>
            <th className="py-3 px-4 text-left ">Amount</th>
            <th className="py-3 px-4 text-left ">Date</th>
            <th className="py-3 px-4 text-left ">Status</th>
            <th className="py-3 px-4 text-left ">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoiceData.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-100">
              <td className="py-3 px-4">{invoice.invoiceNumber}</td>
              <td className="py-3 px-4">{invoice.billTo?.name}</td>
              <td className="py-3 px-4">{invoice.billTo?.email}</td>
              <td className="py-3 px-4">
                ₹{(invoice.products || []).reduce((acc, p) => acc + p.total, 0)}
              </td>
              <td className="py-3 px-4">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">{invoice.paymentStatus}</td>
              <td className="py-3 px-4 flex gap-2">
                <button
                  onClick={() => handleViewInvoice(invoice.invoiceNumber)}
                  className="bg-blue-900 text-white py-1 px-3 rounded-md"
                >
                  View
                </button>
                <button
                  onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
                  className="text-red-500 hover:text-red-700"
                >
                  <AiOutlineDelete size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Popup Modal for Invoice Details */}
      {isPopupOpen && selectedInvoice && (
        <div className="fixed top-0 left-0 w-full h-full bg-blue-800 bg-opacity-50 flex justify-center items-center">
          <div
            className="bg-white p-4 rounded-lg shadow-lg w-2/4 md:w-2/3 lg:w-1/4 relative overflow-y-auto max-h-[100vh]"
            id="popup-modal"
          >
            <h2 className="text-2xl font-bold text-blue-800 mb-2 text-right">
              Invoice #{selectedInvoice.invoiceNumber}
            </h2>
            <p className="text-1xl font-bold text-blue-800 mb-5 text-right">
              Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
            </p>

            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-5 left-7 text-red-600 hover:text-red-900"
            >
              <AiOutlineClose size={30} />
            </button>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg shadow">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  Client Details
                </h3>
                {[
                  { label: "Name", key: "name" },
                  { label: "Address", key: "address" },
                  { label: "Phone", key: "phone" },
                  { label: "Zipcode", key: "zip" },
                  { label: "GST Number", key: "gstNo" },
                  { label: "Aadhaar No", key: "aadhaar" },
                ].map((field) => (
                  <div key={field.key} className="flex mb-4 text-1xl gap-2">
                    <span className="font-bold text-gray-700">
                      {field.label}:
                    </span>
                    <span className="text-gray-900">
                      {selectedInvoice.billTo?.[field.key] || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
              {/* Total Section */}
              <div className="mb-2 bg-blue-100 p-2 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">
                  Invoice Totals
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total GST:</span>
                    <span className="text-gray-900">
                      ₹{calculateTotalAmount().totalGST.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Subtotal:</span>
                    <span className="text-gray-900">
                      ₹{calculateTotalAmount().totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Discount:</span>
                    <span className="text-gray-900">
                      ₹{selectedInvoice.discount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">
                      Final Amount (Incl. GST):
                    </span>
                    <span className="text-gray-900">
                      ₹{calculateTotalAmount().finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Products Table */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">
                Products
              </h3>
              <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="border px-4 py-2 text-left">Product Name</th>
                    <th className="border px-4 py-2 text-left">Quantity</th>
                    <th className="border px-4 py-2 text-left">Unit Price</th>
                    <th className="border px-4 py-2 text-left">Total Price</th>
                    <th className="border px-4 py-2 text-left">GST</th>
                    <th className="border px-4 py-2 text-left">Price + GST</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.products || []).map((product, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">
                        {product.description || "N/A"}
                      </td>
                      <td className="border px-4 py-2">
                        {product.quantity || 0}
                      </td>
                      <td className="border px-4 py-2">
                        ₹{product.price || 0}
                      </td>
                      <td className="border px-4 py-2">
                        ₹{(product.price * product.quantity).toFixed(2) || 0}
                      </td>
                      <td className="border px-4 py-2">
                        ₹{calculateGST(product.price, product.quantity)}
                      </td>
                      <td className="border px-4 py-2">
                        ₹
                        {(
                          product.price * product.quantity +
                          parseFloat(
                            calculateGST(product.price, product.quantity)
                          )
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Shipping Method, Payment Method, Notes, and Signature */}
            <div className="mb-2 bg-blue-100 p-2 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">
                Additional Information
              </h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-blue-900">
                    Shipping Method:
                  </h4>
                  <p className="text-gray-700">
                    {selectedInvoice.shippingMethod || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-900">
                    Payment Method:
                  </h4>
                  <p className="text-gray-700">
                    {selectedInvoice.paymentMethod || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-900">
                    Notes:
                  </h4>
                  <p className="text-gray-700">
                    {selectedInvoice.note || "No additional notes"}
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-900">
                    Signature:
                  </h4>
                  <p className="text-gray-700">
                    {selectedInvoice.signature || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div className="mt-6 text-right">
              <button
                onClick={handlePrint}
                className="bg-blue-900 text-white py-2 px-2 rounded-md"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAllInvoice;
