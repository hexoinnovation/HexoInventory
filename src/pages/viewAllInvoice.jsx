import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete, AiOutlineFilePdf } from "react-icons/ai";
import { auth, db } from "../config/firebase"; // Ensure this is correctly configured

const ViewAllInvoice = () => {
  const [user] = useAuthState(auth);
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0); // New state for total amount


  // Fetch invoices from Firestore
  const fetchInvoices = async () => {
    if (!user?.email) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const invoicesRef = collection(db, "admins", user.email, "Invoices");
      const querySnapshot = await getDocs(invoicesRef);

      const invoices = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Fetched Invoices:", invoices);
      setInvoiceData(invoices);
      setLoading(false);

// Count Paid and Unpaid invoices
const paid = invoices.filter((invoice) => invoice.paymentStatus === "Paid").length;
const unpaid = invoices.filter((invoice) => invoice.paymentStatus === "Unpaid").length;

setPaidCount(paid);
setUnpaidCount(unpaid);

// Calculate the total amount
const total = invoices.reduce((acc, invoice) => {
  const invoiceTotal = (invoice.products || []).reduce((productAcc, product) => productAcc + (product.total || 0), 0);
  return acc + invoiceTotal;
}, 0);

setTotalAmount(total); // Update total amount

    } catch (error) {
      console.error("Error fetching invoices:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to fetch invoices. Please try again.",
      });
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchInvoices();
    }
  }, [user]);

  const handleDeleteInvoice = async (invoiceNumber) => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Not Logged In",
        text: "Please log in to delete an invoice.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
  
    try {
      // Confirm deletion
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won’t be able to undo this action!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
      });
  
      if (result.isConfirmed) {
        // Reference to the Firestore document
        const invoiceDocRef = doc(
          db,
          "admins",
          user.email,
          "Invoices",
          invoiceNumber.toString()
        );
  
        // Delete document in Firestore
        await deleteDoc(invoiceDocRef);
  
        // Update state to remove the deleted invoice
        setInvoiceData((prevInvoices) =>
          prevInvoices.filter((invoice) => invoice.invoiceNumber !== invoiceNumber)
        );
  
        // Success notification
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: `Invoice ${invoiceNumber} has been deleted successfully.`,
          confirmButtonText: "Okay",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
  
      // Error notification
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete the invoice. Please try again later.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#d33",
      });
    }
  };
  

const handleDownloadInvoice = async (invoiceNumber) => {
  try {
    // Reference to the invoice document in Firestore
    const invoiceDocRef = doc(
      db,
      "admins",
      user.email,
      "Invoices",
      invoiceNumber.toString()
    );

    // Fetch the document
    const invoiceDocSnap = await getDoc(invoiceDocRef);

    if (invoiceDocSnap.exists()) {
      const invoiceData = invoiceDocSnap.data();
      console.log("Invoice details:", invoiceData);

      // Create a new PDF document
      const pdfDoc = new jsPDF();

      // Get the page width and height
      const pageWidth = pdfDoc.internal.pageSize.getWidth();
      const pageHeight = pdfDoc.internal.pageSize.getHeight();

      // Set margins for the content to avoid overlap with the border
      const margin = 10;

      // Draw the border around the entire page (with some margin from the edges)
      pdfDoc.setLineWidth(0.5);
      pdfDoc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin); // Border for the page
      pdfDoc.setTextColor(0, 0, 255); // Blue
      // Add the title
      pdfDoc.setFontSize(16); // Set a larger font size for the title
      pdfDoc.text("Invoice Generator", pageWidth / 2, 20, { align: "center" , });

      // Set font size for content
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor('red');
      pdfDoc.text(`Invoice Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`, 20, 30);
      pdfDoc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 20, 35);

      pdfDoc.setFontSize(11); 
      pdfDoc.setTextColor('black');
      // Define the starting Y position and line height
      let startYPosition = 35; // Starting vertical position
      const lineHeight = 10; // Space between lines
      const marginLeft = 20; // Left margin for "Bill From"
      const marginRight = 30; // Right margin for "Bill To"
     
      // Add "Bill From" details (Left side)

      pdfDoc.text(`Company: ${invoiceData.billFrom?.businessName}`, marginLeft, (startYPosition += lineHeight));
      pdfDoc.text(`Reg Number: ${invoiceData.billFrom?.registrationNumber}`, marginLeft, (startYPosition += lineHeight));
      pdfDoc.text(`Address: ${invoiceData.billFrom?.address}`, marginLeft, (startYPosition += lineHeight));
      pdfDoc.text(`Contact: ${invoiceData.billFrom?.contactNumber}`, marginLeft, (startYPosition += lineHeight));
      pdfDoc.text(`Email: ${invoiceData.billFrom?.email}`, marginLeft, (startYPosition += lineHeight));
      pdfDoc.text(`GST Number: ${invoiceData.billFrom?.gstNumber}`, marginLeft, (startYPosition += lineHeight));
      pdfDoc.text(`Aadhar: ${invoiceData.billFrom?.aadhaar}`, marginLeft, (startYPosition += lineHeight));
      pdfDoc.text(`PAN Number: ${invoiceData.billFrom?.panno}`, marginLeft, (startYPosition += lineHeight));

      // Reset starting Y position for "Bill To"
      startYPosition = 35;
// Helper function for right-aligned text
const addRightAlignedText = (text, yPosition) => {
  // Get the width of the text
  const textWidth = pdfDoc.getTextWidth(text);
  
  // Calculate the X position to align the text to the right
  const marginRight = 20;  // Right margin
  const xPosition = pageWidth - textWidth - marginRight;

  // Add the text to the PDF at the calculated position
  pdfDoc.text(text, xPosition, yPosition);
};
// Add "Bill To" details (Right side)
addRightAlignedText(`Customer Name: ${invoiceData.billTo?.name}`, (startYPosition += lineHeight));
addRightAlignedText(`Email: ${invoiceData.billTo?.email}`, (startYPosition += lineHeight));
addRightAlignedText(`Phone: ${invoiceData.billTo?.phone}`, (startYPosition += lineHeight));
addRightAlignedText(`Address: ${invoiceData.billTo?.address}`, (startYPosition += lineHeight));
addRightAlignedText(`City: ${invoiceData.billTo?.city}`, (startYPosition += lineHeight));
addRightAlignedText(`State: ${invoiceData.billTo?.state}`, (startYPosition += lineHeight));
addRightAlignedText(`ZipCode: ${invoiceData.billTo?.zipCode}`, (startYPosition += lineHeight));
addRightAlignedText(`GstNumber: ${invoiceData.billTo?.gstNumber}`, (startYPosition += lineHeight));
addRightAlignedText(`Aadhaar: ${invoiceData.billTo?.aadhaar}`, (startYPosition += lineHeight));
addRightAlignedText(`Panno: ${invoiceData.billTo?.panno}`, (startYPosition += lineHeight));
addRightAlignedText(`Website: ${invoiceData.billTo?.website}`, (startYPosition += lineHeight));

      // Define the starting Y position for the products table
      let yOffset = 170;

      // Define table header columns
      const headers = ["Name", "Quantity", "Rate", "Price"];
      const columnXPositions = [10, 70, 100, 140]; // X positions for each column
      const rowHeight = 12; // Height of each row

      // Set line width for the borders
      pdfDoc.setLineWidth(0.5);
      
      // Add table header with outline
      pdfDoc.rect(10, yOffset - rowHeight, 130, rowHeight).stroke(); // Outline for the header row
      headers.forEach((header, index) => {
        pdfDoc.text(header, columnXPositions[index], yOffset); // Add header content
      });
      yOffset += rowHeight; // Move to the next row for products

      // Add outline for each product row (including borders around product rows)
      const products = invoiceData.products || [];
      if (products.length > 0) {
        products.forEach((product, index) => {
          // Check for undefined or missing fields and provide fallback values
          const productName = product.name || 'Unknown'; // Fallback to 'Unknown' if name is missing
          const quantity = product.quantity || 0; // Fallback to 0 if quantity is missing
          const price = product.price && !isNaN(product.price) ? product.price : 0; // Fallback to 0 if price is invalid
          const rate = product.rate && !isNaN(product.rate) ? product.rate : 0; // Fallback to 0 if rate is invalid

          // Draw border for each product row
          pdfDoc.rect(40, yOffset - rowHeight, 140, rowHeight).stroke(); // Border for the product row

          // Add product content
       
          pdfDoc.text(`${productName}`, columnXPositions[0], yOffset); // Product name
          pdfDoc.text(`${quantity}`, columnXPositions[1], yOffset); // Product quantity
          pdfDoc.text(`₹${Number(price).toFixed(2)}`, columnXPositions[3], yOffset); // Product price
          pdfDoc.text(`₹${Number(rate).toFixed(2)}`, columnXPositions[2], yOffset); // Product rate

          yOffset += rowHeight; // Move to the next row
        });
      }

      // Optionally, you can add a border around the entire table (optional)
      pdfDoc.rect(10, 160, 130, rowHeight * (products.length + 1)).stroke(); // Border for the entire table

      // Define top margin for consistency
      const topMargin = 220;
      let yPosition = topMargin;

      // Payment details alignment
      pdfDoc.text(`Payment Status: ${invoiceData.paymentStatus}`, 20, yPosition);
      yPosition += 10; // Add some space for the next line

      pdfDoc.text(`Shipping Method: ${invoiceData.shippingMethod}`, 20, yPosition);
      yPosition += 10;

      pdfDoc.text(`Payment Method: ${invoiceData.paymentMethod}`, 20, yPosition);
      yPosition += 10; // Adjust space if needed for next content

      // Add tax details to the PDF on the right side with top alignment
      pdfDoc.setTextColor('red'); // Green
      pdfDoc.text(`CGST: ₹${invoiceData.taxDetails?.CGST || 0}`, 140, 220);
      pdfDoc.text(`SGST: ₹${invoiceData.taxDetails?.SGST || 0}`, 140, 220 + 10); // Add 10px space between each line
      pdfDoc.text(`IGST: ₹${invoiceData.taxDetails?.IGST || 0}`, 140, 220 + 20); // Add space for the third line

      // Add subtotal and total to the PDF with left alignment
      pdfDoc.setTextColor('red'); // Green
      pdfDoc.text(`Subtotal: ₹${invoiceData.subtotal}`, 140, yPosition);
      yPosition += 10; // Move to the next line for the total amount

      const totalAmount = Number(invoiceData.total);
      pdfDoc.setTextColor('red'); // Green
      if (!isNaN(totalAmount)) {
        pdfDoc.text(`Total: ₹${totalAmount.toFixed(2)}`, 140, yPosition);
      }

      // Save the PDF
      pdfDoc.save(`Invoice_${invoiceNumber}.pdf`);
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
  }
};

const [filter, setFilter] = useState({
  paymentStatus: "",
  startDate: "",
  endDate: "",
  customerName: "",
});

const handleFilterChange = (e) => {
  const { name, value } = e.target;
  setFilter({
    ...filter,
    [name]: value,
  });
};


const applyFilter = (data,filterCriteria) => {
  let filteredData = data;

  if (filter.paymentStatus) {
    filteredData = filteredData.filter(item => item.paymentStatus === filter.paymentStatus);
  }
  if (filter.customerName) {
    filteredData = filteredData.filter(item => item.customerName.toLowerCase().includes(filter.customerName.toLowerCase()));
  }
  if (filter.specificDate) {
    filteredData = filteredData.filter(item => new Date(item.date).toDateString() === new Date(filter.specificDate).toDateString());
  }

  setFilteredResults(filteredData);
};

  return (
    <div className="container mx-auto p-6 mt-5 bg-white rounded-lg shadow-lg">
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6 flex items-center">View All Invoices</h1>

{/* Invoice counts */}
<div className="flex justify-between mb-4">
  <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300 w-full mx-2">
    <h3 className="text-xl font-semibold text-indigo-600">Paid Count</h3>
    <p className="text-4xl font-bold text-yellow-500">{paidCount}</p>
  </div>

  <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300 w-full mx-2">
    <h3 className="text-xl font-semibold text-indigo-600">Unpaid Count </h3>
    <p className="text-4xl font-bold text-yellow-500">{unpaidCount}</p>
  </div>

{/* Total Amount */}
<div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300 w-full mx-2">
    <h3 className="text-xl font-semibold text-indigo-600" >Total Amount</h3>
    <p className="text-4xl font-bold text-yellow-500" >₹{totalAmount.toFixed(2)}</p>
  </div>
</div>


<div className="flex flex-wrap gap-4 mb-8">
  <label className="flex flex-col font-bold w-48">
    Payment Status:
    <select
      name="paymentStatus"
      value={filter.paymentStatus}
      onChange={handleFilterChange}
      className="mt-2 p-2 border border-gray-300 rounded-md"
    >
      <option value="">All</option>
      <option value="Paid">Paid</option>
      <option value="Unpaid">Unpaid</option>
    </select>
  </label>

  <label className="flex flex-col font-bold w-48">
    Customer Name:
    <input
      type="text"
      name="customerName"
      value={filter.customerName}
      onChange={handleFilterChange}
      placeholder="Customer Name"
      className="mt-2 p-2 border border-gray-300 rounded-md"
    />
  </label>

  {/* New Date Filter */}
  <label className="flex flex-col font-bold w-48">
    Specific Date:
    <input
      type="date"
      name="specificDate"
      value={filter.specificDate}
      onChange={handleFilterChange}
      className="mt-2 p-2 border border-gray-300 rounded-md"
    />
  </label>

  <button
    onClick={applyFilter}
    className="mt-4 py-3 px-6 bg-blue-500 text-white rounded-md hover:bg-blue-600"
  >
    Apply Filter
  </button>
</div>


      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-2 px-4 text-left">UID</th>
              <th className="py-2 px-4 text-left">Client</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Amount</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.map((invoice) => (
              <tr key={invoice.id} className="border-b">
                <td className="py-3 px-4">{invoice.invoiceNumber}</td>
                <td className="py-3 px-4">{invoice.billTo?.name}</td>
                <td className="py-3 px-4">{invoice.billTo?.email}</td>
                <td className="py-3 px-4">
                  ₹{(invoice.products || []).reduce((acc, p) => acc + p.total, 0).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">{invoice.paymentStatus}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
                    className="text-green-500 hover:text-green-700 mx-1"
                  >
                    <AiOutlineFilePdf size={20} />
                  </button>
                  <button
              onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
              className="text-red-500 hover:text-red-700 mx-1"
            >
              <AiOutlineDelete size={20} />
            </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewAllInvoice;
