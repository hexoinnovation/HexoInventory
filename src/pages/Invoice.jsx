import { jsPDF } from "jspdf";
import React, { useState } from "react";
import { FaTrashAlt } from "react-icons/fa"; // For Delete icon
import { FiDownload } from "react-icons/fi";

// Modal for Editing Data (Bill To and Bill From)
const EditModal = ({ visible, onClose, title, formData, onSave, onChange }) => {
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
    name: "Your Company Name",
    email: "company@example.com",
    address: "456 Company St, City",
    phone: "987-654-3210",
    gst: "99XYZ9876D1Z8",
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

  const handleSaveInvoice = () => {
    const invoice = {
      invoiceNumber,
      invoiceDate,
      billTo,
      billFrom,
      products,
      shippingMethod,
      paymentMethod,
      notes,
      signature,
    };
    alert("Invoice Saved!");
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Invoice No: ${invoiceNumber}`, 10, 10);
    doc.text(`Date: ${invoiceDate}`, 10, 20);
    doc.text(`Total: ₹${grandTotal.toFixed(2)}`, 10, 30);
    doc.text(`Shipping Method: ${shippingMethod}`, 10, 40);
    doc.text(`Payment Method: ${paymentMethod}`, 10, 50);
    doc.text(`Notes: ${notes}`, 10, 60);
    doc.text(`Signature: ${signature}`, 10, 70);
    doc.save("invoice.pdf");
  };

  const totalValue = products.reduce((sum, product) => sum + product.total, 0);
  const taxValue = products.reduce(
    (sum, product) => sum + (product.total - product.quantity * product.rate),
    0
  );
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
            <h2 className="text-xl font-semibold">Bill To</h2>
            <div>{billTo.name}</div>
            <div>{billTo.email}</div>
            <div>{billTo.address}</div>
            <div>{billTo.phone}</div>
            <div>{billTo.gst}</div>
            <button
              onClick={() => handleEdit("billTo")}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          </div>

          <div className="w-1/3 text-right">
            <h2 className="text-xl font-semibold">Bill From</h2>
            <div>{billFrom.name}</div>
            <div>{billFrom.email}</div>
            <div>{billFrom.address}</div>
            <div>{billFrom.phone}</div>
            <div>{billFrom.gst}</div>
            <button
              onClick={() => handleEdit("billFrom")}
              className="mt-2 text-blue-600 hover:text-blue-800"
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
              <th className="py-2 px-4 text-left">HSN</th>
              <th className="py-2 px-4 text-left">Quantity</th>
              <th className="py-2 px-4 text-left">Rate</th>
              <th className="py-2 px-4 text-left">Tax</th>
              <th className="py-2 px-4 text-left">Total</th>
              <th className="py-2 px-4"></th>
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
                    value={product.hsnCode}
                    onChange={(e) =>
                      handleProductChange(index, "hsnCode", e.target.value)
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
                <td className="py-2 px-4">
                  <input
                    type="number"
                    value={product.taxRate}
                    onChange={(e) =>
                      handleProductChange(index, "taxRate", e.target.value)
                    }
                    className="w-full px-2 py-1 border rounded-md"
                  />
                </td>
                <td className="py-2 px-4">{product.total.toFixed(2)}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrashAlt /> {/* Trash icon */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Display Totals */}
        <div className="flex justify-end">
          <div className="text-right">
            <h3 className="font-semibold text-red-900">
              Total: ₹{totalValue.toFixed(2)}
            </h3>
            <h3 className="font-semibold text-red-900">
              Tax: ₹{taxValue.toFixed(2)}
            </h3>
            <h3 className="font-semibold text-red-900">
              Grand Total: ₹{grandTotal.toFixed(2)}
            </h3>
          </div>
        </div>
        <button
          onClick={handleAddProduct}
          className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
        >
          Add Product
        </button>

        {/* Payment & Shipping Methods */}
        <div className="flex justify-between mb-6">
          <div>
            <label className="font-semibold">Shipping Method</label>
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
            <label className="font-semibold">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="Credit Card">UPI</option>
              <option value="Debit Card">Current account</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        {/* Additional Notes and Signature in the same row */}
        <div className="flex justify-between mb-6">
          <div className="w-1/2 pr-2">
            <label className="font-semibold">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            ></textarea>
          </div>

          <div className="w-1/2 pl-2">
            <label className="font-semibold">Signature</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiDownload />
            Download PDF
          </button>
          <button
            onClick={handleSaveInvoice}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
