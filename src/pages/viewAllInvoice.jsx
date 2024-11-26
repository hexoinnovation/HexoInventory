import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  AiOutlineDelete,
  AiOutlineEdit,
  AiOutlineFilePdf,
} from "react-icons/ai";
import { Link } from "react-router-dom"; // Import Link from react-router-dom for navigation
import { auth, db } from "../config/firebase"; // Replace with your Firebase configuration path

const ViewAllInvoice = () => {
  const [user] = useAuthState(auth);
  const [invoiceData, setInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [infobox, setInfobox] = useState(null); // State to manage the infobox message

  useEffect(() => {
    const fetchInvoiceData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          const userDocRef = doc(db, "admins", user.email);
          const invoiceQuery = query(
            collection(userDocRef, "Invoices"),
            orderBy("createdAt", "desc") // Ordering by the creation date of the invoice
          );

          const querySnapshot = await getDocs(invoiceQuery);
          const fetchedData = [];
          querySnapshot.forEach((doc) => {
            fetchedData.push({ id: doc.id, ...doc.data() });
          });

          setInvoiceData(fetchedData);
          setInfobox({
            type: "success",
            message: `Invoices loaded successfully. You have ${fetchedData.length} invoice(s).`,
          });
        } catch (error) {
          console.error("Error fetching invoice data:", error);
          setInfobox({ type: "error", message: "Failed to load invoices." });
        }
      } else {
        console.log("No user is signed in.");
        setInfobox({
          type: "warning",
          message: "You must be signed in to view invoices.",
        });
      }

      setLoading(false);
    };

    fetchInvoiceData();
  }, [user]);

  const handleDeleteInvoice = async (invoiceId) => {
    if (!user) {
      setInfobox({ type: "error", message: "User not authenticated." });
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this invoice?"
    );
    if (!confirmDelete) return;

    try {
      const invoiceRef = doc(db, "admins", user.email, "Invoices", invoiceId);
      await deleteDoc(invoiceRef);
      setInvoiceData((prevData) =>
        prevData.filter((invoice) => invoice.id !== invoiceId)
      );
      setInfobox({
        type: "success",
        message: `Invoice deleted successfully! You now have ${
          invoiceData.length - 1
        } invoice(s).`,
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setInfobox({
        type: "error",
        message: "Failed to delete invoice. Please try again.",
      });
    }
  };

  const handleEditInvoice = (invoiceId) => {
    console.log(`Editing invoice with ID: ${invoiceId}`);
    // You can redirect to the Edit Invoice page or open a modal for editing
  };

  const handleDownloadInvoice = (invoiceId) => {
    console.log(`Downloading invoice with ID: ${invoiceId}`);
    // Integrate PDF generation logic
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
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Products</th>
                <th className="py-3 px-4 text-left">Total Price</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-yellow-100">
                  <td className="py-3 px-4">
                    <Link
                      to={`/invoice/${invoice.id}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(
                      invoice.createdAt.seconds * 1000
                    ).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{invoice.customerName}</td>
                  <td className="py-3 px-4">
                    {invoice.products.map((product, index) => (
                      <div key={index}>
                        {product.description} (Qty: {product.quantity}, Price: $
                        {product.rate})
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-4">${invoice.totalPrice}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleEditInvoice(invoice.id)}
                      className="ml-4 text-blue-500 hover:text-blue-700"
                    >
                      <AiOutlineEdit size={20} />
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="ml-4 text-green-500 hover:text-green-700"
                    >
                      <AiOutlineFilePdf size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
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
