import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  getDoc
} from "firebase/firestore";
import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete, AiOutlineEdit, AiOutlineFilePdf } from "react-icons/ai";
import { Link } from "react-router-dom";
import { auth, db } from "../config/firebase"; // Replace with your Firebase config

const ViewAllInvoice = () => {
  const [user] = useAuthState(auth);
  const [infobox, setInfobox] = useState(null); // State to manage infobox message
  const [invoiceData, setInvoiceData] = useState([]); // State to store invoices
  const [loading, setLoading] = useState(true);

  // Fetch data from Firestore
  const fetchInvoices = async () => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const invoicesDocRef = doc(userDocRef, "Invoices", "paid unpaid");

      const paidInvoicesCollection = collection(invoicesDocRef, "paid");
      const unpaidInvoicesCollection = collection(invoicesDocRef, "unpaid");

      const [paidSnapshot, unpaidSnapshot] = await Promise.all([
        getDocs(paidInvoicesCollection),
        getDocs(unpaidInvoicesCollection),
      ]);

      const paidInvoices = paidSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const unpaidInvoices = unpaidSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

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

  const handleDeleteInvoice = async (invoiceNumber, paymentStatus) => {
    try {
      // Log the parameters to check if they're valid
      console.log("Invoice Number (Before Trim):", invoiceNumber);
      console.log("Payment Status:", paymentStatus);
  
      // Ensure invoiceNumber is a valid string and not empty or just whitespace
      const invoiceNumberStr = String(invoiceNumber).trim(); // Ensure it's a string and trim whitespace
  
      if (!invoiceNumberStr || invoiceNumberStr === '') {
        throw new Error("Invalid or missing invoice number");
      }
  
      // Check payment status
      const paymentStatusStr = String(paymentStatus).trim();
      if (!paymentStatusStr || paymentStatusStr === '') {
        throw new Error("Invalid or missing payment status");
      }
  
      // Construct Firestore document reference for the invoice to delete
      const invoiceDocRef = doc(db, "admins", user.email, "Invoices", paymentStatusStr, invoiceNumberStr);
  
      console.log("Document reference path:", invoiceDocRef.path); // Log the reference path for debugging
  
      // Delete invoice document
      await deleteDoc(invoiceDocRef);
  
      // Show success message
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `Invoice ${invoiceNumberStr} has been deleted.`,
        confirmButtonText: "Okay",
        confirmButtonColor: "#3085d6",
      });
  
      // Fetch updated invoices
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "There was an issue deleting the invoice. Please try again.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#d33",
      });
    }
  };
  
  

  // Handle invoice download
  const handleDownloadInvoice = async (invoiceNumber, status) => {
    console.log(`Downloading invoice with ID: ${invoiceNumber}, Status: ${status}`);

    try {
      const invoiceDocRef = doc(db, "admins", user.email, "Invoices", status, invoiceNumber);
      const invoiceDocSnap = await getDoc(invoiceDocRef);

      if (invoiceDocSnap.exists()) {
        const invoiceData = invoiceDocSnap.data();
        console.log("Invoice details:", invoiceData);

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
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6">View All Invoices</h1>

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
                <th className="py-3 px-4 text-left">UID</th>
                <th className="py-3 px-4 text-left">CLIENT</th>
                <th className="py-3 px-4 text-left">EMAIL</th>
                <th className="py-3 px-4 text-left">AMOUNT</th>
                <th className="py-3 px-4 text-left">ISSUEDATE</th>
                <th className="py-3 px-4 text-left">STATUS</th>
                <th className="py-3 px-4 text-left">ACTIONS</th>
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
                  <td className="py-3 px-4">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                  <td
  className={`py-1 px-3 ${
    invoice.paymentStatus === "Paid" 
      ? "text-green-700 bg-green-300 bg-opacity-80 shadow-lg hover:shadow-xl" 
      : invoice.paymentStatus === "Unpaid" 
      ? "text-red-700 bg-red-300 bg-opacity-80 shadow-lg hover:shadow-xl" 
      : ""
  } 
  rounded-full text-center font-semibold text-sm transition-all duration-300 ease-in-out transform hover:scale-110 hover:rotate-2 cursor-pointer`}
>
  {invoice.paymentStatus}
</td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id, invoice.paymentStatus)}
                      className="ml-4 text-green-500 hover:text-green-700"
                    >
                      <AiOutlineFilePdf size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.invoiceNumber, invoice.paymentStatus)} // Ensure these are correct properties
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
