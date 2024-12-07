import React, { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaShoppingCart } from "react-icons/fa";
import { IoIosCloseCircle, IoIosArrowUp } from "react-icons/io";
import { auth, db } from "../config/firebase";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Sales = () => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [filters, setFilters] = useState({
    Bno: "",
    cname: "",
    pname: "",
    fromDate: "",
    toDate: "",
    status: "",
  });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [user] = useAuthState(auth);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const invoiceRef = collection(userDocRef, "Invoices");
        const invoiceSnapshot = await getDocs(invoiceRef);

        const invoices = invoiceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInvoiceData(invoices);
      } catch (error) {
        console.error("Error fetching invoices: ", error);
      }
    };

    fetchData();
  }, [user]);

  const filteredInvoiceData = invoiceData.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate);
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
    const toDate = filters.toDate ? new Date(filters.toDate) : null;

    const isDateInRange =
      (!fromDate || invoiceDate >= fromDate) &&
      (!toDate || invoiceDate <= toDate);

    const matchesInvoiceNumber = invoice.invoiceNumber
      .toString()
      .includes(filters.Bno);
    const matchesCustomerName = invoice.billTo?.name
      .toLowerCase()
      .includes(filters.cname.toLowerCase());
    const matchesProductName = invoice.products
      .map((product) => product.description)
      .join(", ")
      .toLowerCase()
      .includes(filters.pname.toLowerCase());
    const matchesStatus =
      !filters.status ||
      invoice.status.toLowerCase() === filters.status.toLowerCase();

    return (
      isDateInRange &&
      matchesInvoiceNumber &&
      matchesCustomerName &&
      matchesProductName &&
      matchesStatus
    );
  });

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
  };

  const handleScroll = () => {
    if (document.getElementById("popup-modal").scrollTop > 200) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  const scrollToTop = () => {
    document
      .getElementById("popup-modal")
      .scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-6 flex items-center">
        Sales Management
        <FaShoppingCart className="animate-drift ml-4" />
      </h1>

      {/* Info Box - Sales Summary */}
      <div className="mb-6 grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total GST */}
        <div className="bg-blue-900 p-4 rounded-md shadow-lg">
          <p className="font-semibold text-lg">Total GST:</p>
          <p className="text-xl">{`₹${(
            calculateTotalAmount().totalGST || 0
          ).toFixed(2)}`}</p>
        </div>

        {/* Total Amount */}
        <div className="bg-green-700 p-4 rounded-md shadow-lg">
          <p className="font-semibold text-lg">Total Amount:</p>
          <p className="text-xl">{`₹${(
            calculateTotalAmount().totalAmount || 0
          ).toFixed(2)}`}</p>
        </div>

        {/* Final Amount */}
        <div className="bg-yellow-700 p-4 rounded-md shadow-lg">
          <p className="font-semibold text-lg">Final Amount:</p>
          <p className="text-xl">{`₹${(
            calculateTotalAmount().finalAmount || 0
          ).toFixed(2)}`}</p>
        </div>

        {/* Discount Amount */}
        <div className="bg-red-700 p-4 rounded-md shadow-lg">
          <p className="font-semibold text-lg">Discount Amount:</p>
          <p className="text-xl">{`₹${(selectedInvoice?.discount || 0).toFixed(
            2
          )}`}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-blue-700 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
              value={filters.cname}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, cname: e.target.value }))
              }
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Customer Name"
            />
          </div>

          <div>
            <label
              htmlFor="pname"
              className="text-white block mb-1 font-semibold"
            >
              Product Name
            </label>
            <input
              type="text"
              id="pname"
              value={filters.pname}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, pname: e.target.value }))
              }
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Product Name"
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
              <th className="py-3 px-4 text-left">Sales</th>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popup Modal for Invoice Details */}
      {isPopupOpen && selectedInvoice && (
        <div className="fixed top-0 left-0 w-full h-full bg-blue-800 bg-opacity-50 flex justify-center items-center">
          <div
            id="popup-modal"
            className="bg-white p-2 md:p-2 lg:p-2 rounded-lg shadow-lg w-2/4 md:w-2/3 lg:w-1/4 relative overflow-y-auto max-h-[100vh]"
            onScroll={handleScroll}
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
              <IoIosCloseCircle size={30} />
            </button>

            {/* Scroll Up Button */}
            {showScrollButton && (
              <button
                onClick={scrollToTop}
                className="absolute bottom-6 right-6 bg-blue-900 text-white p-3 rounded-full hover:bg-blue-700"
              >
                <IoIosArrowUp size={20} />
              </button>
            )}

            {/* Bill From and Bill To Section */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mb-4">
              {/* Bill From */}
              <div className="bg-blue-100 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Bill From
                </h3>
                {[
                  { label: "Company Name", key: "businessName" },
                  { label: "Address", key: "address" },
                  { label: "Contact", key: "contact" },
                  { label: "GST Number", key: "gstNumber" },
                ].map((field) => (
                  <div key={field.key} className="flex justify-between mb-1">
                    <span className="font-bold text-gray-700">
                      {field.label}:
                    </span>
                    <span className="text-gray-900">
                      {selectedInvoice.billFrom?.[field.key] || "N/A"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill To */}
              <div className="bg-blue-100 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Bill To
                </h3>
                {[
                  { label: "Name", key: "name" },
                  { label: "Address", key: "address" },
                  { label: "City", key: "city" },
                  { label: "GST Number", key: "gstNo" },
                ].map((field) => (
                  <div key={field.key} className="flex justify-between mb-1">
                    <span className="font-bold text-gray-700">
                      {field.label}:
                    </span>
                    <span className="text-gray-900">
                      {selectedInvoice.billTo?.[field.key] || "N/A"}
                    </span>
                  </div>
                ))}
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

            {/* Total Section */}
            <div className="mb-2 bg-blue-100 p-2 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">
                Invoice Totals
              </h3>
              <div className="grid grid-cols-2 gap-4">
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

export default Sales;
