import { faCircleXmark, faPrint } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";
import {
  collection,
  db,
  doc,
  getDocs,
  query,
  setDoc,
} from "../config/firebase";

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
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState([
    {
      id: 1,
      description: "Product 1",
      hsnCode: "1234",
      quantity: 1,
      price: 100,
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

    if (field === "quantity" || field === "price") {
      const total =
        updatedProducts[index].quantity *
        updatedProducts[index].price *
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

  const calculateGST = () => {
    return products.reduce((totalGST, product) => {
      return totalGST + (product.total - product.quantity * product.price);
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

  const [category, setCategory] = useState(""); // CGST
  const [status, setStatus] = useState(""); // SGST
  const [icst, setICst] = useState(""); // IGST
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // State Variables
  const [cgst, setCgst] = useState(""); // For CGST value
  const [sgst, setSgst] = useState(""); // For SGST value
  const [igst, setIgst] = useState(""); // For IGST value
  const [submittedTax, setSubmittedTax] = useState(null); // For storing the submitted tax value

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
    const gst = cgst + sgst; // or just igst if IGST is applicable
    return subtotal + gst;
  };

  const handleCategorySubmit = () => {
    // Perform any necessary tax calculation
    // Example: Assuming you have a subtotal value of ₹118.00
    const subtotal = 118.0;

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

    // Print Handler
    const handlePrint = () => {
      const printContent = document.getElementById("invoiceContainers"); // Get the invoice container
      const printWindow = window.open("", "", "height=700, width=1000"); // Open a new window
  
      // Add styles for print
      printWindow.document.write("<html><head><title>Print Invoice</title>");
      printWindow.document.write("<style>");
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h3 { margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td, th { padding: 8px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f0f0f0; }
        p { margin: 5px 0; }
        .hidden-print { display: none; } /* Hide elements with this class during print */
        @media print {
          body {
            margin-top: 0;
          }
          .sidebar {
            display: none !important; /* Hide sidebar during print */
          }
          .content {
            margin-top: 0 !important; /* Adjust content margins for print */
          }
          .print\\:hidden {
            display: none; /* Hide elements with class 'print:hidden' */
          }
  .bill-to-right-align {
    display: flex;
    justify-content: flex-end;
    text-align: right;
    width: 100%;
  }
        }
      `);
      printWindow.document.write("</style></head><body>");
      printWindow.document.write(printContent.outerHTML); // Clone and write the invoice content
      printWindow.document.write("</body></html>");
  
      printWindow.document.close(); // Close the document for rendering
      printWindow.print(); // Open the print dialog
    };
  
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => setIsOpen(false);
  const [showModal, setShowModal] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const [newBusiness, setNewBusiness] = useState({
    businessName: "",
    registrationNumber: "",
    contactNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    gstNumber: "",
    aadhaar: "",
    panno: "",
    website: "",
    email: "",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBusiness((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleInputChangee = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddBusiness = async (e) => {
    e.preventDefault();
    const {
      businessName,
      registrationNumber,
      contactNumber,
      address,
      city,
      state,
      zipCode, // Corrected field
      gstNumber,
      aadhaar, // Corrected field
      panno, // Corrected field
      website,
      email,
    } = newBusiness;

    if (
      !businessName ||
      !registrationNumber ||
      !contactNumber ||
      !address ||
      !city ||
      !state ||
      !zipCode || // Corrected field
      !gstNumber ||
      !aadhaar || // Corrected field
      !panno || // Corrected field
      !website ||
      !email
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const businessRef = collection(userDocRef, "Businesses");
      await setDoc(doc(businessRef, registrationNumber), {
        ...newBusiness, // Store the entire business object
      });

      setBusinesses((prev) => [...prev, { ...newBusiness }]);
      alert("Business added successfully!");
      setNewBusiness({
        businessName: "",
        registrationNumber: "",
        contactNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "", // Corrected field
        gstNumber: "",
        aadhaar: "", // Corrected field
        panno: "", // Corrected field
        website: "",
        email: "",
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding business: ", error);
    }
  };

  const handleUpdateBusiness = async (e) => {
    e.preventDefault();
    const {
      businessName,
      registrationNumber,
      contactNumber,
      address,
      city,
      state,
      zipCode, // Corrected field
      gstNumber,
      aadhaar, // Corrected field
      panno, // Corrected field
      website,
      email,
    } = newBusiness;

    if (
      !businessName ||
      !registrationNumber ||
      !contactNumber ||
      !address ||
      !city ||
      !state ||
      !zipCode || // Corrected field
      !gstNumber ||
      !aadhaar || // Corrected field
      !panno || // Corrected field
      !website ||
      !email
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const businessRef = collection(userDocRef, "Businesses");
      const businessDocRef = doc(businessRef, registrationNumber);

      await updateDoc(businessDocRef, {
        ...newBusiness, // Update the business data
      });

      setBusinesses((prev) =>
        prev.map((business) =>
          business.registrationNumber === registrationNumber
            ? { ...newBusiness }
            : business
        )
      );

      alert("Business updated successfully!");
      setNewBusiness({
        businessName: "",
        registrationNumber: "",
        contactNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "", // Corrected field
        gstNumber: "",
        aadhaar: "", // Corrected field
        panno: "", // Corrected field
        website: "",
        email: "",
      });
      setShowEditModal(false); // Close the edit modal
    } catch (error) {
      console.error("Error updating business: ", error);
      alert("Failed to update business. Please try again.");
    }
  };
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    gst: "",
  });
  const [Customers, setCustomers] = useState([]);
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      gst,
      aadhaar,
      panno,
    } = newCustomer;

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !gst ||
      !aadhaar ||
      !panno
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const customerRef = collection(userDocRef, "Customers");
      await setDoc(doc(customerRef, email), {
        ...newCustomer, // Store the entire customer object
      });

      setCustomers((prev) => [...prev, { ...newCustomer }]);
      alert("Customer added successfully!");
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        gst: "",
        aadhaar: "",
        panno: "",
      });
      setopenModal(false);
    } catch (error) {
      console.error("Error adding customer: ", error);
    }
  };
  const placeholderNames = {
    name: "Customer Name",
    email: "Email",
    phone: "Phone Number",
    address: "Address",
    city: "City",
    state: "State",
    zip: "Zip Code",
    gst: "GST No",
    aadhaar: "Aadhaar No",
    panno: "PAN No",
  };
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const customersRef = collection(userDocRef, "Customers");
        const customerSnapshot = await getDocs(customersRef);
        const customerList = customerSnapshot.docs.map((doc) => doc.data());
        setCustomers(customerList);
      } catch (error) {
        console.error("Error fetching customers: ", error);
      }
    };

    fetchCustomers();
  }, [user]);
  const [openModal, setopenModal] = useState(false);
  const [description, setDescription] = useState(""); // Store input value
  const [filteredProducts, setFilteredProducts] = useState([]); // Store filtered product suggestions

  // Fetch products from the database
  const fetchAndFilterProducts = async (searchText) => {
    try {
      const userDocRef = doc(db, "admins", user.email);
      const productsRef = collection(userDocRef, "Purchase");
      const productSnapshot = await getDocs(productsRef);

      if (productSnapshot.empty) {
        console.warn("No products found in Purchase collection.");
        return [];
      }

      // Filter products based on searchText
      const productList = productSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((product) =>
          product.pname.toLowerCase().includes(searchText.toLowerCase())
        );

      return productList;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Handle the change in the description input field

  const handleDescriptionChange = async (index, e) => {
    const value = e.target.value;

    // Update the product description in the current row
    const updatedProducts = [...products];
    updatedProducts[index].description = value;
    setProducts(updatedProducts);

    // Fetch and filter products from the database
    if (value.trim() !== "") {
      const filtered = await fetchAndFilterProducts(value); // Fetch filtered products
      const updatedSuggestions = [...filteredProducts];
      updatedSuggestions[index] = filtered;
      setFilteredProducts(updatedSuggestions);
    } else {
      // Clear suggestions if input is empty
      const updatedSuggestions = [...filteredProducts];
      updatedSuggestions[index] = [];
      setFilteredProducts(updatedSuggestions);
    }
  };

  const handleProductSelection = (index, selectedProduct) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      description: selectedProduct.pname,
      hsnCode: selectedProduct.hsnCode,
      price: selectedProduct.price, // Fetch rate from the selected product
      quantity: updatedProducts[index].quantity || 1, // Default to 1 if not already set
      total: selectedProduct.price * (updatedProducts[index].quantity || 1), // Calculate total
    };
    setProducts(updatedProducts);

    // Clear suggestions for the current row
    const updatedSuggestions = [...filteredProducts];
    updatedSuggestions[index] = [];
    setFilteredProducts(updatedSuggestions);
  };

  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const [isLightMode, setIsLightMode] = useState(true); // Track the toggle state
  const [paymentStatus, setPaymentStatus] = useState(""); // Track Paid/Unpaid status

  // Handle toggle between Paid and Unpaid
  const handleToggleMode = () => {
    setIsLightMode((prevMode) => !prevMode);
    setPaymentStatus(isLightMode ? "Unpaid" : "Paid");
  };

  const [errorMessage, setErrorMessage] = useState(""); // Tracks the error message

  


const handleActionConfirm = async () => {
  // Check if paymentStatus is selected
  if (!paymentStatus) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Status',
      text: 'Please select a status (Paid or Unpaid) before submitting.',
    });
    return;
  }

  try {
    // Reference the user's document (admins collection)
    const userDocRef = doc(db, "admins", user.email);

    // Reference the specific document in the "Invoices" collection
    const invoicesDocRef = doc(userDocRef, "Invoices", "default"); // "default" can be replaced with your invoice identifier

    // Reference the subcollection ("paid" or "unpaid") under the Invoices document
    const subCollectionName = paymentStatus === "Paid" ? "paid" : "unpaid";
    
    // Use invoiceNumber as the document ID in the subcollection
    const subCollectionRef = doc(invoicesDocRef, subCollectionName, invoiceNumber.toString());

    // Add or update the document with the payment status and invoice details
    await setDoc(subCollectionRef, {
      paymentStatus,
      invoiceDate,
      invoiceNumber,
      billFrom,
      billTo,
      products,
      shippingMethod, // Add shipping method
      paymentMethod, // Add payment method
      taxDetails: {
        CGST: category || null, // Set CGST if selected, otherwise null
        SGST: status || null, // Set SGST if selected, otherwise null
        IGST: icst || null, // Set IGST if selected, otherwise null
      },
      subtotal: calculateSubtotal().toFixed(2), // Include the subtotal value
      total: calculateTotal().toFixed(2), // Include the total value
      createdAt: new Date(),
      // Add any other invoice details you need to store here
    });
    // Success alert using SweetAlert2
    Swal.fire({
      icon: 'success',
      title: 'Status Saved!',
      text: `Status "${paymentStatus}" for Invoice No: ${invoiceNumber} has been saved successfully!`,
    });
  } catch (error) {
    console.error("Error saving status to Firestore:", error);

    // Error alert using SweetAlert2
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'There was an error saving the status. Please try again.',
    });
  }
};


  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-indigo-200 via-blue-100 to-green-100 p-8">
      <div  id="invoiceContainers"  className="bg-white shadow-xl rounded-lg w-full sm:w-3/4 lg:w-2/3 p-8 border-2 border-indigo-600">
        <h1 className="text-4xl font-bold text-center text-indigo-700 mb-6">
          Invoice Generator
        </h1>
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div  className="w-full sm:w-1/3 mb-4 sm:mb-0">
            <h2  className="text-xl font-semibold text-gray-800">
              Invoice Details
            </h2>
            <div  className="text-blue-600">Invoice No: {invoiceNumber}</div>
            <div className="text-blue-600">Date: {invoiceDate}</div>
          </div>

          {/* Bill From and Bill To in the same row */}
          <div className="w-full sm:w-2/3 flex justify-between space-x-6">
            {/* Bill From */}
            <div className="w-full sm:w-1/2">
              <div className="flex flex-col mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                  Bill From
                  <button
  className="ml-3 text-white bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center shadow-lg print:hidden"
  onClick={() => setShowModal(true)}
  aria-label="Add"
>
  <span className="print:hidden text-3xl font-bold">+</span>
</button>
                </h2>

                {/* Add Business Modal */}
                {showModal && (
                  <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl max-h-[670px] mt-20">
                      {/* Modal Header */}
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">
                          Add Business
                        </h2>
                        <button
                          onClick={() => setShowModal(false)}
                          className="text-gray-500 hover:text-gray-700 text-2xl font-bold "
                          aria-label="Close"
                        >
                          &times;
                        </button>
                      </div>

                      {/* Modal Form */}
                      <form onSubmit={handleAddBusiness}>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Business Name */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="businessName"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Business Name
                            </label>
                            <input
                              type="text"
                              id="businessName"
                              name="businessName"
                              value={newBusiness.businessName}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your business name"
                            />
                          </div>
                          {/* Registration Number */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="registrationNumber"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Registration Number
                            </label>
                            <input
                              type="text"
                              id="registrationNumber"
                              name="registrationNumber"
                              value={newBusiness.registrationNumber}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter registration number"
                            />
                          </div>
                          {/* Contact Number */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="contactNumber"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Contact Number
                            </label>
                            <input
                              type="text"
                              id="contactNumber"
                              name="contactNumber"
                              value={newBusiness.contactNumber}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter contact number"
                            />
                          </div>
                          {/* GST Number */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="gstNumber"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              GST Number
                            </label>
                            <input
                              type="text"
                              id="gstNumber"
                              name="gstNumber"
                              value={newBusiness.gstNumber}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter GST number"
                            />
                          </div>
                          {/* Address */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="address"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Address
                            </label>
                            <input
                              type="text"
                              id="address"
                              name="address"
                              value={newBusiness.address}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter address"
                            />
                          </div>
                          {/* City */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="city"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              City
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={newBusiness.city}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter city"
                            />
                          </div>
                          {/* State */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="state"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              State
                            </label>
                            <input
                              type="text"
                              id="state"
                              name="state"
                              value={newBusiness.state}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter state"
                            />
                          </div>
                          {/* Zip Code */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="zipCode"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Zip Code
                            </label>
                            <input
                              type="text"
                              id="zipCode"
                              name="zipCode"
                              value={newBusiness.zipCode}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter zip code"
                            />
                          </div>
                          {/* Aadhaar No */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="aadhaar"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Aadhaar No
                            </label>
                            <input
                              type="text"
                              id="aadhaar"
                              name="aadhaar"
                              value={newBusiness.aadhaar}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter Aadhaar number"
                            />
                          </div>
                          {/* PAN No */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="panno"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              PAN No
                            </label>
                            <input
                              type="text"
                              id="panno"
                              name="panno"
                              value={newBusiness.panno}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter PAN number"
                            />
                          </div>
                          {/* Website */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="website"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Website
                            </label>
                            <input
                              type="text"
                              id="website"
                              name="website"
                              value={newBusiness.website}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter website URL"
                            />
                          </div>
                          {/* Email */}
                          <div className="flex flex-col">
                            <label
                              htmlFor="email"
                              className="text-sm font-medium text-gray-700 mb-1"
                            >
                              Email
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={newBusiness.email}
                              onChange={handleInputChange}
                              className="border px-4 py-2 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter email"
                            />
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end space-x-4 mt-1">
                          <button
                            type="submit"
                            className="bg-green-500 text-white py-2 px-6 rounded-lg shadow hover:bg-green-600 transition mb-40"
                          >
                            Add Business
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <select
                  value={billFrom.id || ""}
                  onChange={handleBusinessChange}
                  className=" print:hidden w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="#">Select Business</option>
                  {businessList.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.businessName}
                    </option>
                  ))}
                </select>
                {billFrom.registrationNumber && (
  <div className="mt-4 text-gray-600">
    <div className="print\\:right-align">
      <div className="flex flex-wrap">
        <div className="w-full sm:w-1/2">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Company:</span>
              <span className="w-2/3">{billFrom.businessName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Reg Number:</span>
              <span className="w-2/3">{billFrom.registrationNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Address:</span>
              <span className="w-2/3">{billFrom.address}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Contact:</span>
              <span className="w-2/3">{billFrom.contactNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Email:</span>
              <span className="w-2/3">{billFrom.email}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Website:</span>
              <span className="w-2/3">{billFrom.website}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">GST Number:</span>
              <span className="w-2/3">{billFrom.gstNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Aadhar:</span>
              <span className="w-2/3">{billFrom.aadhaar}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">PAN Number:</span>
              <span className="w-2/3">{billFrom.panno}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">State:</span>
              <span className="w-2/3">{billFrom.state}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
              </div>
            </div>

            {/* Bill To */}
            <div className="w-full sm:w-1/2">
              <div className="flex flex-col mb-4">
              <h2 className="print\\:right-align text-xl font-semibold text-gray-800 mb-2 flex items-center">
              Bill To
                  <button
                    onClick={() => setopenModal(true)}
                    className=" print:hidden ml-3 text-white bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                    aria-label="Add Customer"
                  >
                    <span className=" print:hidden text-3xl font-bold">+</span>
                  </button>
                </h2>
                {openModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[600px] overflow-auto mb-1">
                      <h3 className="text-2xl mb-4">Add Customer</h3>
                      <form onSubmit={handleAddCustomer}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {Object.keys(placeholderNames).map((key) => (
                            <div key={key} className="flex flex-col">
                              <label
                                htmlFor={key}
                                className="font-medium text-gray-700"
                              >
                                {placeholderNames[key]}
                              </label>
                              <input
                                type="text"
                                id={key}
                                name={key}
                                value={newCustomer[key]}
                                onChange={handleInputChangee}
                                className="border px-3 py-2 rounded-lg"
                                placeholder={placeholderNames[key]}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex justify-between">
                          <button
                            type="submit"
                            className="bg-green-500 text-white py-2 px-6 rounded-lg"
                          >
                            Add Customer
                          </button>
                          <button
                            type="button"
                            onClick={() => setopenModal(false)}
                            className="bg-gray-500 text-white py-2 px-6 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Customer Select Dropdown */}
                <select
                  value={billTo.id || ""}
                  onChange={handleCustomerChange}
                  className=" print:hidden w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Customer</option>
                  {customerList.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>

              {/* Displaying selected customer's details */}
{billTo.name && (
  <div className="mt-4 text-gray-600">
    <div className="print\\:right-align">
      <div className="flex flex-wrap">
        <div className="w-full sm:w-1/2">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Name:</span>
              <span className="w-2/3">{billTo.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Email:</span>
              <span className="w-2/3">{billTo.email}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Phone:</span>
              <span className="w-2/3">{billTo.phone}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Address:</span>
              <span className="w-2/3">{billTo.address}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">City:</span>
              <span className="w-2/3">{billTo.city}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">State:</span>
              <span className="w-2/3">{billTo.state}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Zip Code:</span>
              <span className="w-2/3">{billTo.zip}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">GST No:</span>
              <span className="w-2/3">{billTo.gst}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">Aadhaar No:</span>
              <span className="w-2/3">{billTo.aadhaar}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-bold w-1/3">PAN No:</span>
              <span className="w-2/3">{billTo.panno}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

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
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={`${product.id}-${index}`}>
                  {/* Description Input */}
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      value={product.description}
                      onChange={(e) => handleDescriptionChange(index, e)}
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Type to search products"
                    />
                    {/* Suggestions Dropdown */}
                    {filteredProducts[index]?.length > 0 && (
                      <ul className="absolute bg-white border rounded-md shadow-lg z-10 w-full">
                        {filteredProducts[index].map((suggestedProduct) => (
                          <li
                            key={suggestedProduct.id}
                            onClick={() =>
                              handleProductSelection(index, suggestedProduct)
                            }
                            className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                          >
                            {suggestedProduct.pname}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  {/* HSN Code Field */}
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
                  {/* Quantity Field */}
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
                  {/* Rate Field */}
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          "price",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  {/* Total Field */}
                  <td className=" border px-4 py-2">
                    {typeof product.total === "number"
                      ? product.total.toFixed(2)
                      : "0.00"}
                  </td>
                  {/* Remove Button */}
                  <td className=" print:hidden border px-4 py-2">
                    <button
                      onClick={() => handleRemoveProduct(index)}
                      className=" print:hidden bg-red-500 text-white px-4 py-2 rounded-md"
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
            className=" print:hidden bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            Add Product
          </button>
        </div>

        <div className="text-right print\\:right-align ">
          {/* Subtotal (Always Visible) */}
          <div className="text-xl font-semibold text-blue-600 mb-2">
            Subtotal: ₹{calculateSubtotal().toFixed(2)}
          </div>

          {/* Conditionally Display CGST */}
          {category && (
            <div className="text-lx font-semibold text-red-800 mb-2">
              CGST ({category}%): ₹{calculateCGST().toFixed(2)}
            </div>
          )}

          {/* Conditionally Display SGST */}
          {status && (
            <div className="text-lx font-semibold text-red-800 mb-2">
              SGST ({status}%): ₹{calculateSGST().toFixed(2)}
            </div>
          )}

          {/* Conditionally Display IGST */}
          {icst && (
            <div className="text-lx font-semibold text-red-800 mb-2">
              IGST ({icst}%): ₹{calculateIGST().toFixed(2)}
            </div>
          )}

          {/* Conditionally Display GST (CGST + SGST) */}
          {category && status && (
            <div className="text-lx font-semibold text-red-800 mb-2">
              GST (CGST + SGST): ₹
              {(calculateCGST() + calculateSGST()).toFixed(2)}
            </div>
          )}

          {/* Total (Always Visible) */}
          <div className="text-xl font-semibold text-green-500">
            Total: ₹{calculateTotal().toFixed(2)}
          </div>
        </div>
        {/* Shipping and Payment Buttons */}
        <div className="flex justify-start items-center space-x-4 mb-6">
          <button
            onClick={handleOpenModal}
            className=" print:hidden bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            Shipping & Payment Method
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="print:hidden bg-blue-600 text-white px-6 py-2 rounded-md"
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
            className="print\\:right-align fixed inset-0 flex justify-center items-center bg-black bg-opacity-50"
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
          <div className="mt-6 w-full sm:w-1/2">
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
          <div className="mt-6 signature-right-align w-full sm:w-1/2">
  <label className="signature-right-align block text-xl font-semibold text-gray-800 mb-2">
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
              className="bg-blue-600 text-white px-8 py-3 text-lg font-semibold rounded-md mb-4 flex items-center print:hidden "
            >
              <FontAwesomeIcon icon={faPrint} className="mr-2" />{" "}
              {/* Print icon with margin */}
              Print
            </button>

            {/* Submit Button aligned to the right */}
            <button
              onClick={handleOpenPopup}
              className="print:hidden bg-blue-600 text-white px-8 py-4 text-xl font-semibold rounded-md"
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
            className="bg-white p-8 rounded-md shadow-lg w-1/3 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Icon */}
            <button
              onClick={handleDismissPopup}
              className="absolute top-2 right-4 text-2xl text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>

            <h2 className="text-2xl font-semibold text-center mb-4 text-red-600">
              Do you want to Save invoice?
            </h2>

            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-4">
              {/* Toggle Button */}
              <button
                onClick={handleToggleMode}
                className="relative w-80 h-12 rounded-md overflow-hidden border-2 border-gray-300 shadow-lg"
              >
                {/* Paid Section */}
                <div
                  className={`absolute inset-y-0 left-0 w-1/2 flex items-center justify-center ${
                    isLightMode ? "bg-green-600 text-black" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  Paid
                </div>

                {/* Unpaid Section */}
                <div
                  className={`absolute inset-y-0 right-0 w-1/2 flex items-center justify-center ${
                    !isLightMode ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  Unpaid
                </div>
              </button>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleActionConfirm}
                className="bg-blue-400 text-white px-8 py-3 text-lg font-semibold rounded-md w-80"
              >
                Submit
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
