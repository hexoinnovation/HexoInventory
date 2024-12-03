import React, { useEffect, useState } from "react";
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
import { auth, db } from "../config/firebase";

const ViewAllInvoice = () => {
  const [user] = useAuthState(auth);
  const [invoiceData, setInvoiceData] = useState([]);
  const [filteredInvoiceData, setFilteredInvoiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [filter, setFilter] = useState({
    paymentStatus: "",
    startDate: "",
    endDate: "",
    specificDate: "",
    customerName: "",
    invoiceNumber: "",
    existingClient: "", // New filter for existing clients
  });

  useEffect(() => {
    if (user?.email) {
      fetchInvoices();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [filter, invoiceData]);

  const fetchInvoices = async () => {
    try {
      const invoicesRef = collection(db, "admins", user.email, "Invoices");
      const querySnapshot = await getDocs(invoicesRef);

      const invoices = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setInvoiceData(invoices);
      setFilteredInvoiceData(invoices);

      const paid = invoices.filter(
        (invoice) => invoice.paymentStatus === "Paid"
      ).length;
      const unpaid = invoices.filter(
        (invoice) => invoice.paymentStatus === "Unpaid"
      ).length;

      setPaidCount(paid);
      setUnpaidCount(unpaid);

      const total = invoices.reduce((acc, invoice) => {
        const invoiceTotal = (invoice.products || []).reduce(
          (productAcc, product) => productAcc + (product.total || 0),
          0
        );
        return acc + invoiceTotal;
      }, 0);

      setTotalAmount(total);

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value,
    });
  };

  const applyFilter = () => {
    let filteredData = [...invoiceData];

    if (filter.paymentStatus) {
      filteredData = filteredData.filter(
        (item) =>
          item.paymentStatus?.toLowerCase() ===
          filter.paymentStatus.toLowerCase()
      );
    }

    if (filter.customerName) {
      filteredData = filteredData.filter((item) =>
        item.billTo?.name
          ?.toLowerCase()
          .includes(filter.customerName.toLowerCase())
      );
    }

    if (filter.startDate) {
      filteredData = filteredData.filter(
        (item) => new Date(item.invoiceDate) >= new Date(filter.startDate)
      );
    }

    if (filter.endDate) {
      filteredData = filteredData.filter(
        (item) => new Date(item.invoiceDate) <= new Date(filter.endDate)
      );
    }

    if (filter.specificDate) {
      filteredData = filteredData.filter(
        (item) =>
          new Date(item.invoiceDate).toDateString() ===
          new Date(filter.specificDate).toDateString()
      );
    }

    if (filter.invoiceNumber) {
      filteredData = filteredData.filter((item) =>
        item.invoiceNumber.toString().includes(filter.invoiceNumber)
      );
    }

    if (filter.existingClient) {
      filteredData = filteredData.filter(
        (item) =>
          item.existingClient?.toLowerCase() ===
          filter.existingClient.toLowerCase()
      );
    }

    setFilteredInvoiceData(filteredData);
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-5xl font-extrabold text-blue-700 mb-6">
        View All Invoices
      </h1>

      {/* Info Boxes */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-6 bg-blue-600 text-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Paid Count</h3>
          <p className="text-4xl">{paidCount}</p>
        </div>
        <div className="p-6 bg-green-600 text-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Unpaid Count</h3>
          <p className="text-4xl">{unpaidCount}</p>
        </div>
        <div className="p-6 bg-red-600 text-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Total Amount</h3>
          <p className="text-4xl">₹{totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-blue-700 p-4 rounded-md shadow-md mb-6">
        <h2 className="text-lg font-bold text-gray-100 mb-4">
          Filter Invoices
        </h2>
        <div className="grid grid-cols-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Payment Status */}
          <div>
            <label htmlFor="paymentStatus" className="font-bold text-gray-100">
              Payment Status:
            </label>
            <select
              name="paymentStatus"
              value={filter.paymentStatus}
              onChange={handleFilterChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className="font-bold text-gray-100">
              Customer Name:
            </label>
            <input
              type="text"
              name="customerName"
              value={filter.customerName}
              onChange={handleFilterChange}
              placeholder="Customer Name"
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="font-bold text-gray-100">
              Start Date:
            </label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="endDate" className="font-bold text-gray-100">
              End Date:
            </label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Specific Date */}
          <div>
            <label htmlFor="specificDate" className="font-bold text-gray-100">
              Specific Date:
            </label>
            <input
              type="date"
              name="specificDate"
              value={filter.specificDate}
              onChange={handleFilterChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoiceNumber" className="font-bold text-gray-100">
              Invoice Number:
            </label>
            <input
              type="text"
              name="invoiceNumber"
              value={filter.invoiceNumber}
              onChange={handleFilterChange}
              placeholder="Invoice Number"
              className="mt-2 p-2 w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Existing Client */}

          {/* Filter Button */}
          <div className="flex items-end">
            <button
              onClick={applyFilter}
              className="py-3 px-6 w-full bg-green-500 text-white rounded-md hover:bg-blue-600"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <table className="min-w-full bg-white rounded-lg shadow-md">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="py-2 px-4">UID</th>
            <th className="py-2 px-4">Client</th>
            <th className="py-2 px-4">Email</th>
            <th className="py-2 px-4">Amount</th>
            <th className="py-2 px-4">Date</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoiceData.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-100">
              <td className="py-3 px-4">{invoice.invoiceNumber}</td>
              <td className="py-3 px-4">{invoice.billTo?.name}</td>
              <td className="py-3 px-4">{invoice.billTo?.email}</td>
              <td className="py-3 px-4">
                ₹{(invoice.products || []).reduce((acc, p) => acc + p.total, 0)}
              </td>
              <td className="py-3 px-4">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">{invoice.paymentStatus}</td>
              <td className="py-3 px-4 flex gap-2">
                {/* Action buttons */}
                <button
                  onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <AiOutlineFilePdf size={20} />
                </button>
                <button
                  onClick={() => handleDeleteInvoice(invoice.invoiceNumber)}
                  className="text-red-500 hover:text-red-700"
                >
                  <AiOutlineDelete size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewAllInvoice;
