import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete, AiOutlineEdit, AiOutlineFilePdf } from "react-icons/ai";
import { Link } from "react-router-dom"; // Import Link from react-router-dom for navigation
import { auth, db } from "../config/firebase"; // Replace with your Firebase configuration path

const ViewAllInvoice = () => {
  const [user] = useAuthState(auth);
  const [infobox, setInfobox] = useState(null); // State to manage the infobox message
  const [invoiceData, setInvoiceData] = useState([]); // State to store invoices
  const [loading, setLoading] = useState(true);

  // Fetch data from Firestore
  const fetchInvoices = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      // Reference the user's document
      const userDocRef = doc(db, "admins", user.email);

      // Reference the "Invoices" document
      const invoicesDocRef = doc(userDocRef, "Invoices", "paid unpaid");

      // Reference the "paid" and "unpaid" subcollections under "Invoices"
      const paidInvoicesCollection = collection(invoicesDocRef, "paid");
      const unpaidInvoicesCollection = collection(invoicesDocRef, "unpaid");

      // Fetch data from both collections
      const [paidSnapshot, unpaidSnapshot] = await Promise.all([
        getDocs(paidInvoicesCollection),
        getDocs(unpaidInvoicesCollection),
      ]);

      // Map the data from snapshots
      const paidInvoices = paidSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const unpaidInvoices = unpaidSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine both arrays into a single array and set it to state
      setInvoiceData([...paidInvoices, ...unpaidInvoices]);
      console.log("Invoices fetched successfully:", [...paidInvoices, ...unpaidInvoices]);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchInvoices();
    }
  }, [user]);

  const handleDeleteInvoice = async (invoiceId, paymentStatus) => {
    if (!user || !user.email) {
      Swal.fire({
        icon: "warning",
        title: "User Not Authenticated",
        text: "Please log in to delete an invoice.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
  
    // Log user email for debugging
    console.log("User email:", user.email);
  
    // Log paymentStatus for debugging
    console.log("Payment status:", paymentStatus);
  
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
  
    if (!result.isConfirmed) return; // Exit if canceled
  
    try {
      // Construct the Firestore document reference
      const invoiceRef = doc(
        db,
        "admins",
        user.email,
        "Invoices",
        paymentStatus, // 'paid' or 'unpaid'
        invoiceId // invoiceId is the document ID (invoiceNumber)
      );
  
      // Log the path to make sure it's correct
      console.log("Firestore Document Path:", invoiceRef.path);
  
      // Delete the document from Firestore
      await deleteDoc(invoiceRef);
  
      // Update state to remove deleted invoice
      setInvoiceData((prevData) =>
        prevData.filter((invoice) => invoice.id !== invoiceId)
      );
  
      // Success alert
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Invoice deleted successfully!",
        confirmButtonText: "Okay",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
  
      // Error alert
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete invoice. Please try again.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#d33",
      });
    }
  };
  const handleDownloadInvoice = async (invoiceNumber, status) => {
    console.log(`Downloading invoice with ID: ${invoiceNumber}, Status: ${status}`);
  
    try {
      // Construct the Firestore path
      const invoiceDocRef = doc(db, "admins", user.email, "Invoices", status, invoiceNumber);
      const invoiceDocSnap = await getDoc(invoiceDocRef);
  
      if (invoiceDocSnap.exists()) {
        const invoiceData = invoiceDocSnap.data();
        console.log("Invoice details:", invoiceData);
  
        // Now generate the PDF using the fetched invoice data
        const doc = new jsPDF();
        doc.text(`Invoice ID: ${invoiceData.invoiceNumber}`, 10, 10);
        doc.text(`Customer Name: ${invoiceData.customerName}`, 10, 20);
        doc.text(`Amount: ${invoiceData.amount}`, 10, 30);
        doc.text(`Due Date: ${invoiceData.dueDate}`, 10, 40);
        doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
      } else {
        console.log("No such document!");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Invoice not found.",
          confirmButtonText: "Okay",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "There was an issue fetching the invoice. Please try again.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-purple-50 via-pink-100 to-yellow-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6">
        View All Invoices
      </h1>

      {/* Infobox control */}
      {infobox && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            infobox.type === "success"
              ? "bg-green-100 text-green-800"
              : infobox.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {infobox.message}
        </div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="w-full mt-5">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Invoice Number</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Total</th>
                <th className="py-3 px-4 text-left">Payment Status</th>
                <th className="py-3 px-4 text-left">Invoice Date</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="py-3 px-4">{invoice.invoiceNumber}</td>
                  <td className="py-3 px-4">{invoice.billTo?.name}</td>
                  <td className="py-3 px-4">{invoice.billTo?.email}</td>
                  <td className="py-3 px-4">
                    {invoice.products
                      ? invoice.products.reduce((acc, product) => acc + product.total, 0).toFixed(2)
                      : "0.00"}
                  </td>
                  <td className="py-3 px-4">{invoice.paymentStatus}</td>
                  <td className="py-3 px-4">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="ml-4 text-green-500 hover:text-green-700"
                    >
                      <AiOutlineFilePdf size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.invoiceNumber, invoice.status)}
                      className="ml-4 text-red-500 hover:text-red-700"
                    >
                      <AiOutlineDelete size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewAllInvoice;
