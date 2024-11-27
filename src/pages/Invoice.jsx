import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { collection, db, doc, getDocs, query } from "../config/firebase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
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


  const [category, setCategory] = useState("");  // CGST
const [status, setStatus] = useState("");      // SGST
const [icst, setICst] = useState("");          // IGST
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  

  
  const handleOpenCategoryModal = () => {
    setIsCategoryModalOpen(true);
  };
  

  


// Function to calculate Subtotal (Example)
const calculateSubtotal = () => {
  // Assuming products array contains item total values
  return products.reduce((total, product) => total + product.total, 0);
};

const calculateCGST = () => {
  const subtotal = calculateSubtotal();
  const cgstRate = parseFloat(category);
  return isNaN(cgstRate) ? 0 : (subtotal * cgstRate) / 100;
};

const calculateSGST = () => {
  const subtotal = calculateSubtotal();
  const sgstRate = parseFloat(status);
  return isNaN(sgstRate) ? 0 : (subtotal * sgstRate) / 100;
};

const calculateIGST = () => {
  const subtotal = calculateSubtotal();
  const igstRate = parseFloat(icst);
  return isNaN(igstRate) ? 0 : (subtotal * igstRate) / 100;
};

const calculateTotal = () => {
  const subtotal = calculateSubtotal();
  const cgst = calculateCGST();
  const sgst = calculateSGST();
  const igst = calculateIGST();

  // If both CGST and SGST are selected, GST = CGST + SGST, otherwise GST = IGST
  const gst = cgst + sgst;  // or just igst if IGST is applicable
  return subtotal + gst;
};

const handleCategorySubmit = () => {
  // Perform any necessary tax calculation
  // Example: Assuming you have a subtotal value of ₹118.00
  const subtotal = 118.00;

  // Convert selected tax values to numbers
  const cgstPercentage = parseFloat(category);
  const sgstPercentage = parseFloat(status);
  const igstPercentage = parseFloat(icst);

  // Calculate the tax values
  const cgstAmount = (subtotal * cgstPercentage) / 100;
  const sgstAmount = (subtotal * sgstPercentage) / 100;
  const igstAmount = (subtotal * igstPercentage) / 100;

  // Calculate the total based on the selected taxes
  let total = subtotal;
  if (cgstPercentage && sgstPercentage) {
    total += cgstAmount + sgstAmount; // If CGST and SGST are selected
  } else if (igstPercentage) {
    total += igstAmount; // If IGST is selected
  }

  // Store the calculated values or update the state as needed
  // For example, you can update the invoice with these calculated values
  console.log("Calculated Tax Values", {
    subtotal,
    cgstAmount,
    sgstAmount,
    igstAmount,
    total,
  });

  // Close the modal after submission
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

  const auth = getAuth();
const user = auth.currentUser;
  const [allProducts, setAllProducts] = useState([]); // All products from Firestore
  const [filteredProducts, setFilteredProducts] = useState([]); // Filtered suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const userDocRef = doc(db, "admins", user.email);
        const productsRef = collection(userDocRef, "Stocks");
        const querySnapshot = await getDocs(productsRef);

        const products = querySnapshot.docs.map((doc) => doc.data().pname);
        setAllProducts(products); // Store all product names
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [user.email]);

  // Handle input change and filter suggestions
  const handleInputChange = (e, id) => {
    const value = e.target.value;
    const updatedProducts = [...products]; // Clone the array
    updatedProducts[id] = { ...updatedProducts[id], description: value }; // Update description
    setProducts(updatedProducts); // Update state
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], description: suggestion };
    setProducts(updatedProducts);

    setShowSuggestions(false); // Close suggestions after selection
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
<td className="border px-4 py-2 relative">
      {/* Input Field */}
      <input
      type="text"
      value={product.description || ""}
      onChange={(e) => handleInputChange(e, id)}
      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      onFocus={() => setShowSuggestions(filteredProducts.length > 0)}
      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
    />

      {/* Dropdown Suggestions */}
      {showSuggestions && (
        <ul className="absolute bg-white border border-indigo-300 rounded-md w-full mt-1 shadow-md z-10">
          {filteredProducts.map((suggestion, idx) => (
            <li
              key={idx}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-4 py-2 hover:bg-indigo-100 cursor-pointer"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </td>



                  {/* <td className="border px-4 py-2">
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
                  </td> */}
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
        <div className="text-xl font-semibold text-blue-600 mb-2">
    Subtotal: ₹{calculateSubtotal().toFixed(2)}
  </div>

  {/* Display CGST */}
  <div className="text-lx font-semibold text-red-800 mb-2">
    CGST ({category}%): ₹{calculateCGST().toFixed(2)}
  </div>

  {/* Display SGST */}
  <div className="text-lx font-semibold text-red-800 mb-2">
    SGST ({status}%): ₹{calculateSGST().toFixed(2)}
  </div>

  {/* Display IGST */}
  <div className="text-lx font-semibold text-red-800 mb-2">
    IGST ({icst}%): ₹{calculateIGST().toFixed(2)}
  </div>

  {/* Display GST */}
  <div className="text-lx font-semibold text-red-800 mb-2">
    GST (CGST + SGST): ₹{(calculateCGST() + calculateSGST()).toFixed(2)}
  </div>

  <div className="text-xl font-semibold text-green-500">
    Total: ₹{calculateTotal().toFixed(2)}
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
  onClick={handleOpenCategoryModal}
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



{/* Display the modal */}
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

          {/* CGST Dropdown */}
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
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
            </select>
          </div>

          {/* SGST Dropdown */}
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
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
            </select>
          </div>

          {/* IGST Dropdown */}
          <div className="mb-4">
            <label className="block text-xl font-semibold text-gray-800 mb-2">
              IGST
            </label>
            <select
              value={icst}
              onChange={(e) => setICst(e.target.value)}
              className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select IGST</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
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
      className="bg-white p-8 rounded-md shadow-lg w-1/3 relative" // 'relative' to position the close button
      onClick={(e) => e.stopPropagation()} // Prevent modal closing if content is clicked
    >
      {/* Close Icon */}
      <button
        onClick={handleDismissPopup}
        className="absolute top-2 right-4 text-2xl text-gray-600 hover:text-gray-900"
      >
        <FontAwesomeIcon icon={faCircleXmark} /> {/* FontAwesome Close Icon */}
      </button>

      <h2 className="text-2xl font-semibold text-center mb-4 text-red-600">
        Do you want to Save invoice?
      </h2>

      {/* Action Buttons */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleActionConfirm}
          className="bg-green-400 text-white px-8 py-3 text-lg font-semibold rounded-md w-80"
        >
          Estimate (Unpaid)
        </button>

        <button
          onClick={handleActionConfirm}
          className="bg-blue-400 text-white px-8 py-3 text-lg font-semibold rounded-md w-80"
        >
          Stock (Paid)
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
