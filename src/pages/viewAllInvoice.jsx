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

  // Delete invoice
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
    // Confirm deletion with SweetAlert
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
      const invoiceDocRef = doc(
        db,
        "admins",
        user.email,
        "Invoices",
        invoiceNumber.toString()
      );

      // Delete the invoice from Firestore
      await deleteDoc(invoiceDocRef);

      // Update the UI by filtering out the deleted invoice
      setInvoiceData((prevInvoices) =>
        prevInvoices.filter((invoice) => invoice.invoiceNumber !== invoiceNumber)
      );

      // Success SweetAlert
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

    // Error SweetAlert
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

      // Add the main details to the PDF
      pdfDoc.text(`Invoice Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`, 10, 60);
      pdfDoc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 10, 10);
      pdfDoc.text(`Customer Name: ${invoiceData.billTo?.name}`, 10, 20);
      pdfDoc.text(`Email: ${invoiceData.billTo?.email}`, 10, 30);
      pdfDoc.text(`Phone: ${invoiceData.billTo?.phone}`, 10, 40);
      pdfDoc.text(`Address: ${invoiceData.billTo?.address}`, 10, 50);
      pdfDoc.text(`City: ${invoiceData.billTo?.city}`, 10, 60);
      pdfDoc.text(`State: ${invoiceData.billTo?.state}`, 10, 70);
      pdfDoc.text(`ZipCode: ${invoiceData.billTo?.zipCode}`, 10, 80);
      pdfDoc.text(`GstNumber: ${invoiceData.billTo?.gstNumber}`, 10, 90);
      pdfDoc.text(`Aadhaar: ${invoiceData.billTo?.aadhaar}`, 10, 100);
      pdfDoc.text(`Panno: ${invoiceData.billTo?.panno}`, 10, 110);
      pdfDoc.text(`Website: ${invoiceData.billTo?.website}`, 10, 120);
      pdfDoc.text(`BillFrom: ${invoiceData.billFrom}`, 10, 130);
      pdfDoc.text(`Payment Status: ${invoiceData.paymentStatus}`, 10, 140);
      pdfDoc.text(`Shipping Method: ${invoiceData.shippingMethod}`, 10, 150);
      pdfDoc.text(`Payment Method: ${invoiceData.paymentMethod}`, 10, 160);

      // Add tax details to the PDF
      pdfDoc.text(`CGST: ₹${invoiceData.taxDetails?.CGST || 0}`, 10, 170);
      pdfDoc.text(`SGST: ₹${invoiceData.taxDetails?.SGST || 0}`, 10, 180);
      pdfDoc.text(`IGST: ₹${invoiceData.taxDetails?.IGST || 0}`, 10, 190);

      // Add subtotal and total to the PDF
      pdfDoc.text(`Subtotal: ₹${invoiceData.subtotal}`, 10, 200);
      const totalAmount = Number(invoiceData.total);
      if (!isNaN(totalAmount)) {
        pdfDoc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 10, 210);
      } else {
        console.error("Invalid total amount:", invoiceData.total);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Invalid total amount in invoice.",
        });
        return;
      }

      // Add products table if applicable
      const products = invoiceData.products || [];
      if (products.length > 0) {
        let yOffset = 220; // Start position for the products table

        // Table Header
        pdfDoc.text("Products", 10, yOffset);
        yOffset += 10;
        pdfDoc.text("Name", 10, yOffset);
        pdfDoc.text("Quantity", 70, yOffset);
        pdfDoc.text("Rate", 100, yOffset);
        pdfDoc.text("Total", 140, yOffset);
        yOffset += 10;

        // Table Content
        products.forEach((product, index) => {
          pdfDoc.text(`${index + 1}. ${product.name}`, 10, yOffset);
          pdfDoc.text(`${product.quantity}`, 70, yOffset);
          pdfDoc.text(`₹${Number(product.rate).toFixed(2)}`, 100, yOffset);
          pdfDoc.text(`₹${Number(product.total).toFixed(2)}`, 140, yOffset);
          yOffset += 10;
        });
      }

      // Save the PDF with the invoice number
      pdfDoc.save(`Invoice_${invoiceNumber}.pdf`);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invoice not found.",
      });
    }
  } catch (error) {
    console.error("Error downloading invoice:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to download invoice.",
    });
  }
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
                    onClick={() => handleDeleteInvoice(invoice)}
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
