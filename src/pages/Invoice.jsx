import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { collection, db, doc, getDocs, query } from "../config/firebase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';

const Invoice = () => {
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toLocaleDateString()
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    Math.floor(Math.random() * 100000)
  );
  const [billTo, setBillTo] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    gst: "",
  });

  const [billFrom, setBillFrom] = useState({
    businessName: "",
    email: "",
    address: "",
    contactNumber: "",
    gstNumber: "",
    registrationNumber: "",
    aadhaar: "",
    panno: "",
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      description: "Product 1",
      hsnCode: "1234",
      quantity: 1,
      rate: 100,
      total: 118,
    },
  ]);

  const [customerList, setCustomerList] = useState([]);
  const [businessList, setBusinessList] = useState([]);
  const [shippingMethod, setShippingMethod] = useState(""); // Shipping method state
  const [paymentMethod, setPaymentMethod] = useState(""); // Payment method state
  const [note, setNote] = useState(""); // Note state
  const [signature, setSignature] = useState(""); // Signature state
  const [selectedTaxRate, setSelectedTaxRate] = useState(18); // Default tax rate for new products

  const [isModalOpen, setIsModalOpen] = useState(false); // For controlling modal visibility

  const [selectedShippingMethod, setSelectedShippingMethod] = useState(""); // Store selected shipping method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); // Store selected payment method

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const userDocRef = doc(db, "admins", user.email);

          const customerQuery = query(collection(userDocRef, "Customers"));
          const customerSnapshot = await getDocs(customerQuery);
          const customers = [];
          customerSnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() });
          });
          setCustomerList(customers);

          const businessQuery = query(collection(userDocRef, "Businesses"));
          const businessSnapshot = await getDocs(businessQuery);
          const businesses = [];
          businessSnapshot.forEach((doc) => {
            businesses.push({ id: doc.id, ...doc.data() });
          });
          setBusinessList(businesses);
        } else {
          console.log("No user is signed in.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;

    if (field === "quantity" || field === "rate") {
      const total =
        updatedProducts[index].quantity *
        updatedProducts[index].rate *
        (1 + selectedTaxRate / 100);
      updatedProducts[index].total = total;
    }
    setProducts(updatedProducts);
  };

  const handleAddProduct = () => {
    const newProduct = {
      id: Date.now(),
      description: "",
      hsnCode: "",
      quantity: 1,
      rate: 0,
      total: 0,
    };
    setProducts([...products, newProduct]);
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const handleCustomerChange = (e) => {
    const selectedCustomerId = e.target.value;
    const selectedCustomer = customerList.find(
      (customer) => customer.id === selectedCustomerId
    );
    setBillTo(selectedCustomer);
  };

  const handleBusinessChange = (e) => {
    const selectedBusinessId = e.target.value;
    const selectedBusiness = businessList.find(
      (business) => business.id === selectedBusinessId
    );
    setBillFrom(selectedBusiness);
  };

  const calculateSubtotal = () => {
    return products.reduce((total, product) => total + product.total, 0);
  };

  const calculateGST = () => {
    return products.reduce((totalGST, product) => {
      return totalGST + (product.total - product.quantity * product.rate);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = () => {
    // Store selected shipping and payment methods
    setSelectedShippingMethod(shippingMethod);
    setSelectedPaymentMethod(paymentMethod);
    // Close the modal
    setIsModalOpen(false);
  };

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const handleCategorySubmit = () => {
    console.log("Category:", category);
    console.log("Status:", status);
    setIsCategoryModalOpen(false);
  };
  
  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
  };

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Trigger to show the popup
  const handleOpenPopup = () => {
    setIsPopupOpen(true); // Open the popup
  };

  // Close the popup
  const handleDismissPopup = () => {
    setIsPopupOpen(false); // Close the popup
  };

  // Handle confirm action (any logic you need to execute on confirm)
  const handleActionConfirm = () => {
    console.log("Action confirmed!"); // Action after confirming
    setIsPopupOpen(false); // Close the popup after confirmation
  };

  const handlePrint = () => {
    window.print();  // Open the print dialog
  };
  
  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-indigo-200 via-blue-100 to-green-100 p-8">
      <div className="bg-white shadow-xl rounded-lg w-full sm:w-3/4 lg:w-2/3 p-8 border-2 border-indigo-600">
        <h1 className="text-4xl font-bold text-center text-indigo-700 mb-6">
          Invoice Generator
        </h1>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="w-full sm:w-1/3 mb-4 sm:mb-0">
            <h2 className="text-xl font-semibold text-gray-800">
              Invoice Details
            </h2>
            <div className="text-blue-600">Invoice No: {invoiceNumber}</div>
            <div className="text-blue-600">Date: {invoiceDate}</div>
          </div>

          {/* Bill From and Bill To in the same row */}
          <div className="w-full sm:w-2/3 flex justify-between space-x-6">
            {/* Bill From */}
            <div className="w-full sm:w-1/2">
              <div className="flex flex-col mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Bill From
                </h2>
                <select
                  value={billFrom.id || ""}
                  onChange={handleBusinessChange}
                  className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Business</option>
                  {businessList.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.businessName}
                    </option>
                  ))}
                </select>
                <div className="text-gray-600">{billFrom.businessName}</div>
                <div>{billFrom.email}</div>
                <div>{billFrom.address}</div>
                <div>{billFrom.contactNumber}</div>
                <div>{billFrom.gstNumber}</div>
              </div>
            </div>

            {/* Bill To */}
            <div className="w-full sm:w-1/2">
              <div className="flex flex-col mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Bill To
                </h2>
                <select
                  value={billTo.id || ""}
                  onChange={handleCustomerChange}
                  className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Customer</option>
                  {customerList.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <div className="text-gray-600">{billTo.name}</div>
                <div>{billTo.email}</div>
                <div>{billTo.address}</div>
                <div>{billTo.phone}</div>
                <div>{billTo.gst}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full table-auto">
            <thead className="bg-indigo-100">
              <tr>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">HSN Code</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Rate</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id}>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      value={product.description}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      value={product.hsnCode}
                      onChange={(e) =>
                        handleProductChange(index, "hsnCode", e.target.value)
                      }
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "quantity",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      value={product.rate}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "rate",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    {product.total.toFixed(2)}
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleRemoveProduct(index)}
                      className="bg-red-500 text-white px-4 py-2 rounded-md"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Product Button */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleAddProduct}
            className="bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            Add Product
          </button>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-800 mb-2">
            Subtotal: ₹{calculateSubtotal().toFixed(2)}
          </div>
          <div className="text-lg font-semibold text-gray-800 mb-2">
            GST ({selectedTaxRate}%): ₹{calculateGST().toFixed(2)}
          </div>
          <div className="text-xl font-semibold text-gray-800">
            Total: ₹{calculateGrandTotal().toFixed(2)}
          </div>
        </div>
        {/* Shipping and Payment Buttons */}
        <div className="flex justify-start items-center space-x-4 mb-6">
  <button
    onClick={handleOpenModal}
    className="bg-blue-600 text-white px-6 py-2 rounded-md"
  >
    Shipping & Payment Method
  </button>

  <button
    onClick={() => setIsCategoryModalOpen(true)}
    className="bg-blue-600 text-white px-6 py-2 rounded-md"
  >
    Select Tax Values
  </button>
</div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white p-8 rounded-md shadow-lg w-1/3"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold text-center mb-4">
                Select Shipping and Payment Methods
              </h2>

              {/* Shipping Method Dropdown */}
              <div className="mb-4">
                <label className="block text-xl font-semibold text-gray-800 mb-2">
                  Shipping Method
                </label>
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Shipping Method</option>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="sameDay">Same Day</option>
                </select>
              </div>

              {/* Payment Method Dropdown */}
              <div className="mb-4">
                <label className="block text-xl font-semibold text-gray-800 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Payment Method</option>
                  <option value="creditCard">Credit Card</option>
                  <option value="debitCard">Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-between">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md"
                >
                  Submit
                </button>

                <button
                  onClick={handleCloseModal}
                  className="bg-gray-400 text-white px-6 py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}


{/* Category Modal */}
{isCategoryModalOpen && (
  <div
    className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50"
    onClick={handleCloseCategoryModal}
  >
    <div
      className="bg-white p-8 rounded-md shadow-lg w-1/3"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-semibold text-center mb-4">
        Select Tax Values 
      </h2>

      {/* Category Dropdown */}
      <div className="mb-4">
        <label className="block text-xl font-semibold text-gray-800 mb-2">
        CGST
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select CGST</option>
          <option value="electronics">5%</option>
          <option value="fashion">12%</option>
          <option value="groceries">18%</option>
        </select>
      </div>

      {/* Status Dropdown */}
      <div className="mb-4">
        <label className="block text-xl font-semibold text-gray-800 mb-2">
        SGST
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select SGST</option>
          <option value="active">5%</option>
          <option value="inactive">12%</option>
          <option value="pending">18%</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xl font-semibold text-gray-800 mb-2">
          CST
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select CST</option>
          <option value="active">5%</option>
          <option value="inactive">12%</option>
          <option value="pending">18%</option>
        </select>
      </div>

      {/* Submit and Close Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleCategorySubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-md"
        >
          Submit
        </button>

        <button
          onClick={handleCloseCategoryModal}
          className="bg-gray-400 text-white px-6 py-2 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

        {/* Display selected shipping and payment methods */}
        <div className="mt-6">
          {selectedShippingMethod && (
            <div className="flex items-center mb-4">
              <span className="font-semibold">Shipping Method:</span>
              <span className="ml-2">{selectedShippingMethod}</span>
            </div>
          )}

          {selectedPaymentMethod && (
            <div className="flex items-center">
              <span className="font-semibold">Payment Method:</span>
              <span className="ml-2">{selectedPaymentMethod}</span>
            </div>
          )}
        </div>

        {/* Notes and Signature Section */}
        <div className="flex justify-between space-x-6 mb-4">
          {/* Notes */}
          <div className="w-full sm:w-1/2">
            <label className="block text-xl font-semibold text-gray-800 mb-2">
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Signature */}
          <div className="w-full sm:w-1/2">
            <label className="block text-xl font-semibold text-gray-800 mb-2">
              Signature
            </label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
       <div>



      {/* Submit Button */}
      <div className="flex justify-between items-center">
  {/* Print Page Button aligned to the left */}
  <button
  onClick={handlePrint}
  className="bg-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-md mb-4 flex items-center"
>
  <FontAwesomeIcon icon={faPrint} className="mr-2" /> {/* Print icon with margin */}
  Print
</button>

  {/* Submit Button aligned to the right */}
  <button
    onClick={handleOpenPopup}
    className="bg-blue-600 text-white px-8 py-4 text-xl font-semibold rounded-md"
  >
    Submit
  </button>
</div>

      

      {/* Popup Modal */}
      {isPopupOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50"
          onClick={handleDismissPopup}
        >
          <div
            className="bg-white p-8 rounded-md shadow-lg w-1/3"
            onClick={(e) => e.stopPropagation()} // Prevent modal closing if content is clicked
          >
            <h2 className="text-2xl font-semibold text-center mb-4">
              Do you want to Save invoice 
            </h2>

            {/* Action Buttons */}
            <div >
  <button
    onClick={handleActionConfirm}
    className="bg-green-600  text-white px-8 py-3 text-xl font-semibold rounded-md w-80 mb-5 ml-40"
  >
    Confirm
  </button>
  
  <button
    onClick={handleActionConfirm}
    className="bg-blue-600 text-white px-8 py-3 text-xl font-semibold rounded-md w-80 mb-5 ml-40 "
  >
    Stock (Unpaid)
  </button>
  
  <button
    onClick={handleDismissPopup}
    className="bg-red-600 text-white px-8 py-3 text-xl font-semibold rounded-md w-80 mb-5 ml-40"
  >
    Close
  </button>
</div>

          </div>
        </div>
      )}
    </div>
        {/* Invoice Footer */}
      </div>
    </div>
  );
};

export default Invoice;
