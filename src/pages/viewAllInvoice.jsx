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
    const invoiceDocRef = doc(
      db,
      "admins",
      user.email,
      "Invoices",
      invoiceNumber.toString()
    );
    const invoiceDocSnap = await getDoc(invoiceDocRef);

    if (invoiceDocSnap.exists()) {
      const invoiceData = invoiceDocSnap.data();
      console.log("Invoice details:", invoiceData);

      // Create a new PDF document
      const pdfDoc = new jsPDF();
      pdfDoc.text(`Invoice ID: ${invoiceData.invoiceNumber}`, 10, 10);
      pdfDoc.text(`Customer Name: ${invoiceData.billTo?.name}`, 10, 20);
      pdfDoc.text(`Amount: ₹${invoiceData.total}`, 10, 30);
      pdfDoc.text(
        `Invoice Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`,
        10,
        40
      );
      pdfDoc.text(`Payment Status: ${invoiceData.paymentStatus}`, 10, 50);

      // Save the PDF
      pdfDoc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
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
      <h1 className="text-3xl font-bold mb-6">View All Invoices</h1>
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
