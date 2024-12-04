import React, { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaShoppingCart } from "react-icons/fa";
import { auth, db } from "../config/firebase";
import Swal from "sweetalert2";
import { IoIosCloseCircle } from "react-icons/io";

const Sales = () => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [filters, setFilters] = useState({
    Bno: "",
    cname: "",
    pname: "",
  });
  const [user] = useAuthState(auth);

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
        auth.currentUser.email,
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

  // Function to calculate GST for each product and total GST
  const calculateGST = (price, quantity) => {
    const gstRate = 0.18; // Assuming 18% GST
    return (price * quantity * gstRate).toFixed(2);
  };

  // Function to calculate the total amount including GST
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

  const handlePrint = () => {
    const content = document.getElementById("invoice-content");
    const newWindow = window.open("", "", "width=800,height=600");
    newWindow.document.write(content.innerHTML);
    newWindow.document.close();
    newWindow.print();
  };

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-6 flex items-center">
        Sales Management
        <FaShoppingCart className="animate-drift ml-4" />
      </h1>

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

      {/* Popup for Viewing Invoice Details */}
      {isPopupOpen && selectedInvoice && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div
            className="bg-white p-8 rounded-lg shadow-lg w-2/4 md:w-1/2 lg:w-1/2 xl:w-1/2 relative"
            id="invoice-content"
          >
            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              Invoice #{selectedInvoice.invoiceNumber}
            </h2>
            <span className="text-sm text-gray-900">
              {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
            </span>
            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="absolute top-5 right-7 text-red-600 hover:text-red-900"
            >
              <IoIosCloseCircle size={30} />
            </button>

            {/* Bill From and Bill To - Same Row */}
            <div className="mb-6 flex justify-between">
              {/* Bill From */}
              <div className="flex-1 mr-4 text-sm space-y-1">
                <h3 className="text-lg font-semibold text-blue-900">
                  Bill From:
                </h3>
                <div className="flex justify-between">
                  <span className="font-bold">Company:</span>
                  {selectedInvoice.billFrom?.businessName}
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Reg Number:</span>
                  <span>{selectedInvoice.billFrom?.regNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Address:</span>
                  <span>{selectedInvoice.billFrom?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Contact:</span>
                  <span>{selectedInvoice.billFrom?.contact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Email:</span>
                  <span>{selectedInvoice.billFrom?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Website:</span>
                  <span>{selectedInvoice.billFrom?.website}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">GST Number:</span>
                  <span>{selectedInvoice.billFrom?.gstNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Aadhar:</span>
                  <span>{selectedInvoice.billFrom?.aadhar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">PAN Number:</span>
                  <span>{selectedInvoice.billFrom?.panNumber}</span>
                </div>
              </div>

              {/* Bill To */}
              <div className="flex-1 ml-4 text-sm space-y-2">
                <h3 className="text-lg font-semibold text-blue-900">
                  Bill To:
                </h3>
                <div className="flex justify-between">
                  <span className="font-bold">Name:</span>
                  <span>{selectedInvoice.billTo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Email:</span>
                  <span>{selectedInvoice.billTo?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Phone:</span>
                  <span>{selectedInvoice.billTo?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Address:</span>
                  <span>{selectedInvoice.billTo?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">City:</span>
                  <span>{selectedInvoice.billTo?.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">State:</span>
                  <span>{selectedInvoice.billTo?.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Zip Code:</span>
                  <span>{selectedInvoice.billTo?.zipCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">GST No:</span>
                  <span>{selectedInvoice.billTo?.gstNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Aadhaar No:</span>
                  <span>{selectedInvoice.billTo?.aadhaarNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">PAN No:</span>
                  <span>{selectedInvoice.billTo?.panNo}</span>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-blue-700">Products:</h3>
              <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border px-4 py-2">Product Name</th>
                    <th className="border px-4 py-2">Quantity</th>
                    <th className="border px-4 py-2">Unit Price</th>
                    <th className="border px-4 py-2">Total Price</th>
                    <th className="border px-4 py-2">GST</th>
                    <th className="border px-4 py-2">Price + GST</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.products || []).map((product, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">
                        {product.description}
                      </td>
                      <td className="border px-4 py-2">{product.quantity}</td>
                      <td className="border px-4 py-2">₹{product.price}</td>
                      <td className="border px-4 py-2">
                        ₹{(product.price * product.quantity).toFixed(2)}
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

            {/* Total Amount & GST */}
            <div className="mt-4 text-right">
              <h3 className="text-xl font-semibold text-blue-700">
                Total GST:
              </h3>
              <p>₹{calculateTotalAmount().totalGST.toFixed(2)}</p>
              <h3 className="text-xl font-semibold text-blue-700">
                Total Amount (Including GST):
              </h3>
              <p>₹{calculateTotalAmount().finalAmount.toFixed(2)}</p>
            </div>

            {/* Shipping Method, Payment Method, Notes, and Signature */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              {/* Shipping Method */}
              <div>
                <h3 className="text-xl font-semibold text-blue-700">
                  Shipping Method:
                </h3>
                <p>{selectedInvoice.shippingMethod || "N/A"}</p>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-xl font-semibold text-blue-700">
                  Payment Method:
                </h3>
                <p>{selectedInvoice.paymentMethod || "N/A"}</p>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-xl font-semibold text-blue-700">Notes:</h3>
                <p>{selectedInvoice.notes || "No additional notes"}</p>
              </div>

              {/* Signature */}
              <div>
                <h3 className="text-xl font-semibold text-blue-700">
                  Signature:
                </h3>
                <p>{selectedInvoice.signature || "N/A"}</p>
              </div>
            </div>

            {/* Print Button */}
            <div className="mt-4 text-right">
              <button
                onClick={handlePrint}
                className="bg-blue-900 text-white py-2 px-4 rounded-md"
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
