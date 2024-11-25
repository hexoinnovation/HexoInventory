import { jsPDF } from "jspdf";
import React, { useState,useEffect } from "react";
import { FaTrashAlt } from "react-icons/fa"; // For Delete icon
import { FiDownload } from "react-icons/fi";
import { collection, deleteDoc, doc, getDoc, setDoc,query ,orderBy,limit,getDocs} from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {auth, db } from "../config/firebase";
import { getAuth } from "firebase/auth";

// Modal for Editing Data (Bill To and Bill From)
const EditModal = ({ visible, onClose, title, formData, onSave, onChange }) => {
  
  const [user, setUser] = useState(null);
  return (
    visible && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
          <h2 className="text-2xl font-semibold mb-4">{title}</h2>
          <div>
            <div className="mb-4">
              <label className="block text-sm font-semibold">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onChange("email", e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => onChange("address", e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold">GST</label>
              <input
                type="text"
                value={formData.gst}
                onChange={(e) => onChange("gst", e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => onSave(formData)}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

const Invoice = () => {
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toLocaleDateString()
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    Math.floor(Math.random() * 100000)
  );

  const [billTo, setBillTo] = useState({
    name: "John Doe",
    email: "john@example.com",
    address: "123 Main St, City",
    phone: "123-456-7890",
    gst: "12ABC3456D1Z5",
  });

  const [billFrom, setBillFrom] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    gst: "",
  });
  

  const [products, setProducts] = useState([
    {
      id: 1,
      description: "Product 1",
      hsnCode: "1234",
      quantity: 1,
      rate: 100,
      taxRate: 18,
      total: 118,
    },
  ]);

  const [shippingMethod, setShippingMethod] = useState("Air");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState(""); // For storing signature
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [editType, setEditType] = useState(""); // To distinguish between Bill To and Bill From modal
  const [modalFormData, setModalFormData] = useState({});

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;

    if (field === "quantity" || field === "rate") {
      updatedProducts[index].total =
        updatedProducts[index].quantity *
        updatedProducts[index].rate *
        (1 + updatedProducts[index].taxRate / 100);
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
      taxRate: 18,
      total: 0,
    };
    setProducts([...products, newProduct]);
  };
  const handleSaveInvoice = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        alert("No user is signed in. Please log in to save the invoice.");
        return;
      }
  
      // Convert invoiceNumber to string to ensure Firestore compatibility
      const invoiceId = String(invoiceNumber);
  
      // Validate required fields
      if (!invoiceId) {
        throw new Error("Invoice Number is required.");
      }
  
      // Log field values for debugging
      console.log("Saving invoice with details:", {
        invoiceNumber: invoiceId,
        invoiceDate,
        billTo,
        billFrom,
        products,
        shippingMethod,
        paymentMethod,
        notes,
        signature,
      });
      const createdAt = new Date();
      // Save to Firestore under user's email -> Invoices -> invoiceId
      const userDocRef = doc(db, "admins", user.email);
      const invoiceRef = doc(collection(userDocRef, "Invoices"), invoiceId);
     
      await setDoc(invoiceRef, {
       

        invoiceNumber: invoiceId,
        invoiceDate,
        billTo,
        billFrom,
        products,
        shippingMethod,
        paymentMethod,
        notes,
        signature,
        createdAt: createdAt,
      });
  
      alert("Invoice saved successfully!");
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Please check the input fields and try again.");
    }
  };
  
  
  const handlePrint = () => {
    window.print();
  };
  
  const [taxPercentage, setTaxPercentage] = useState(5); // Default tax percentage

  // Total Value
  const totalValue = products.reduce((sum, product) => sum + product.total, 0);

  // Calculate Tax (CGST & SGST)
  const taxValue = (totalValue * taxPercentage) / 100;
  const cgst = taxValue / 2;
  const sgst = taxValue / 2;
  const grandTotal = totalValue + taxValue;

  // Function to open the modal for editing either Bill To or Bill From
  const handleEdit = (type) => {
    if (type === "billTo") {
      setModalTitle("Edit Bill To");
      setModalFormData({ ...billTo });
    } else if (type === "billFrom") {
      setModalTitle("Edit Bill From");
      setModalFormData({ ...billFrom });
    }
    setEditType(type);
    setModalVisible(true);
  };

  // Handle form data changes in the modal
  const handleModalChange = (field, value) => {
    setModalFormData({
      ...modalFormData,
      [field]: value,
    });
  };

  // Save the edited data
  const handleModalSave = (updatedData) => {
    if (editType === "billTo") {
      setBillTo(updatedData);
    } else if (editType === "billFrom") {
      setBillFrom(updatedData);
    }
    setModalVisible(false);
  };

  // Delete product from table
  const handleDeleteProduct = (id) => {
    const updatedProducts = products.filter((product) => product.id !== id);
    setProducts(updatedProducts);
  };
  useEffect(() => {
    const fetchBillFromDetails = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (user) {
        try {
          // Reference to the user's document in Firestore
          const userDocRef = doc(db, "admins", user.email);
  
          // Query the 'Invoices' collection, ordered by createdAt timestamp (descending), and limit to 1 (most recent)
          const invoiceQuery = query(
            collection(userDocRef, "Invoices"),
            orderBy("createdAt", "desc"), // Order by timestamp (desc for most recent first)
            limit(1) // Limit to 1 result (the latest invoice)
          );
  
          // Fetch the query snapshot
          const querySnapshot = await getDocs(invoiceQuery); // Using getDocs for queries, not getDoc
  
          // Check if any invoice is found
          if (!querySnapshot.empty) {
            // Get the latest invoice document
            const latestInvoice = querySnapshot.docs[0].data();
            console.log("Latest Invoice:", latestInvoice); // Debug log
  
            // Check if billFrom exists in the invoice document
            if (latestInvoice.billFrom) {
              setBillFrom(latestInvoice.billFrom); // Set the BillFrom details from the latest invoice
            } else {
              console.log("billFrom not found in the latest invoice.");
            }
          } else {
            console.log("No invoices found for this user.");
          }
        } catch (error) {
          console.error("Error fetching Bill From details:", error);
        }
      } else {
        console.log("No user is signed in.");
      }
    };
  
    fetchBillFromDetails();
  }, []); // Empty dependency array ensures this effect runs once on mount
  
  return (
    <div className="min-h-screen flex justify-center items-center bg-blue-900 p-8">
      <div className="bg-white shadow-xl rounded-lg w-full sm:w-3/4 lg:w-2/3 p-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-6">
          Invoice Generator
        </h1>
        <div className="w-2/3 text-left">
          <h2 className="text-xl font-semibold">Invoice Details</h2>
          <div>Invoice No: {invoiceNumber}</div>
          <div>Date: {invoiceDate}</div>
        </div>
        <br></br>
        {/* Invoice Header */}
        <div className="flex justify-between mb-6">
          <div className="w-1/3">
            <h2 className="text-xl font-semibold">Bill From</h2>
            <div>{billFrom.name}</div>
<div>{billFrom.email}</div>
<div>{billFrom.address}</div>
<div>{billFrom.phone}</div>
<div>{billFrom.gst}</div>

            <button
              onClick={() => handleEdit("billFrom")}
              className="mt-2 text-blue-600 hover:text-blue-800 print:hidden"
            >
              Edit
            </button>
          </div>

          <div className="w-1/3 text-right">
            <h2 className="text-xl font-semibold">Bill To</h2>
            <div>{billTo.name}</div>
            <div>{billTo.email}</div>
            <div>{billTo.address}</div>
            <div>{billTo.phone}</div>
            <div>{billTo.gst}</div>
            <button
              onClick={() => handleEdit("billTo")}
              className="mt-2 text-blue-600 hover:text-blue-800 print:hidden"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Products Table */}
        <table className="min-w-full bg-gray-100 table-auto mb-6">
          <thead>
            <tr>
              <th className="py-2 px-4 text-left">Description</th>
              <th className="py-2 px-4 text-left">Category</th>
              <th className="py-2 px-4 text-left">Quantity</th>
              <th className="py-2 px-4 text-left">Rate</th>
            
              <th className="py-2 px-4 text-left">Total</th>
              <th className="py-2 px-4 print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.id}>
                <td className="py-2 px-4">
                  <input
                    type="text"
                    value={product.description}
                    onChange={(e) =>
                      handleProductChange(index, "description", e.target.value)
                    }
                    className="w-full px-2 py-1 border rounded-md"
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    type="text"
                    value={product.Category}
                    onChange={(e) =>
                      handleProductChange(index, "Category", e.target.value)
                    }
                    className="w-full px-2 py-1 border rounded-md"
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) =>
                      handleProductChange(index, "quantity", e.target.value)
                    }
                    className="w-full px-2 py-1 border rounded-md"
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    type="number"
                    value={product.rate}
                    onChange={(e) =>
                      handleProductChange(index, "rate", e.target.value)
                    }
                    className="w-full px-2 py-1 border rounded-md"
                  />
                </td>
             
                <td className="py-2 px-4">{product.total.toFixed(2)}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-800 print:hidden"
                  >
                    <FaTrashAlt /> {/* Trash icon */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleAddProduct}
          className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-6 print:hidden"
        >
          Add Product
        </button>
        <div className="space-y-6">
  {/* Tax, Shipping, and Payment in a Straight Line */}
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="font-semibold text-gray-700">
        Select Tax Percentage:
      </label>
      <select
        value={taxPercentage}
        onChange={(e) => setTaxPercentage(Number(e.target.value))}
        className="w-full border rounded px-2 py-1"
      >
        <option value={5}>5%</option>
        <option value={10}>10%</option>
        <option value={15}>15%</option>
        <option value={18}>18%</option>
        <option value={28}>28%</option>
      </select>
    </div>

    <div>
      <label className="font-semibold text-gray-700">Shipping Method:</label>
      <select
        value={shippingMethod}
        onChange={(e) => setShippingMethod(e.target.value)}
        className="w-full px-4 py-2 border rounded-md"
      >
        <option value="Air">DTDC</option>
        <option value="Sea">Safe Express</option>
        <option value="Land">Other</option>
      </select>
    </div>

    <div>
      <label className="font-semibold text-gray-700">Payment Method:</label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-full px-4 py-2 border rounded-md"
      >
        <option value="Credit Card">UPI</option>
        <option value="Debit Card">Current Account</option>
        <option value="Cash">Cash</option>
      </select>
    </div>
  </div>

 {/* Totals Section */}
<div className="relative">
  <div className="absolute left-0 top-0 space-y-2 bg-gray-50 rounded-lg shadow-md p-4 border border-gray-300 w-fit">
    <h3 className="text-lg font-bold text-gray-700">
      Total: <span className="text-red-900">₹{totalValue.toFixed(2)}</span>
    </h3>
    <h3 className="text-lg font-bold text-gray-700">
      CGST (
      <span className="text-blue-600">{(taxPercentage / 2).toFixed(2)}%</span>
      ): <span className="text-red-900">₹{cgst.toFixed(2)}</span>
    </h3>
    <h3 className="text-lg font-bold text-gray-700">
      SGST (
      <span className="text-blue-600">{(taxPercentage / 2).toFixed(2)}%</span>
      ): <span className="text-red-900">₹{sgst.toFixed(2)}</span>
    </h3>
    <h3 className="text-lg font-bold text-gray-700">
      GST (
      <span className="text-blue-600">{taxPercentage}%</span>
      ): <span className="text-red-900">₹{taxValue.toFixed(2)}</span>
    </h3>
    <h3 className="text-lg font-extrabold text-gray-800">
      Grand Total: <span className="text-green-700">₹{grandTotal.toFixed(2)}</span>
    </h3>
  </div>
</div>

  {/* Notes and Signature Section */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="font-semibold ml-80">Additional Notes</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-1/2 h-32 px-4 py-2 border rounded-md ml-80"
      ></textarea>
    </div>
    <div>
      <label className="font-semibold ml-40">Signature</label>
      <input
        type="text"
        value={signature}
        onChange={(e) => setSignature(e.target.value)}
      className="w-1/2 h-20 px-4 py-2 border rounded-md ml-40"
      />
    </div>
  </div>
</div>


        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-80 print:hidden
            "
          >
            <FiDownload />
            Download PDF
          </button>
          <button
  onClick={handleSaveInvoice}
  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 print:hidden"
>
  Save Invoice
</button>

        </div>
      </div>

      {/* Modal for Editing */}
      <EditModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        formData={modalFormData}
        onSave={handleModalSave}
        onChange={handleModalChange}
      />
    </div>
  );
};

export default Invoice;
