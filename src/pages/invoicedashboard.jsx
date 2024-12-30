import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../config/firebase"; // Firestore and Auth configuration
import { useAuthState } from "react-firebase-hooks/auth"; // Firebase auth hook for user

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// InfoBox Component
const InfoBox = ({ title, value, description, color }) => {
  return (
    <div
      className={`flex items-center p-6 bg-gradient-to-r ${color} rounded-xl shadow-lg hover:shadow-2xl transition`}
    >
      <span className="text-white text-4xl font-semibold mr-6">{value}</span>
      <div>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="text-gray-200">{description}</p>
      </div>
    </div>
  );
};

const InvoiceControl = () => {
  const [user] = useAuthState(auth); // Get the current authenticated user
  const [invoices, setInvoices] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);

  useEffect(() => {
    if (!user) return; // Ensure user is logged in before proceeding

    const fetchInvoices = () => {
      const invoicesRef = collection(db, "admins", user.email, "Invoices");
      const unsubscribe = onSnapshot(invoicesRef, (snapshot) => {
        const invoiceData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInvoices(invoiceData);

        // Calculate counts
        const total = invoiceData.length;
        const paid = invoiceData.filter((invoice) => invoice.paymentStatus === "Paid").length;
        const unpaid = invoiceData.filter((invoice) => invoice.paymentStatus === "Unpaid").length;

        setTotalInvoices(total);
        setPaidCount(paid);
        setUnpaidCount(unpaid);
      });

      return () => unsubscribe();
    };

    fetchInvoices();
  }, [user]);

  // Chart data
  const invoiceData = {
    labels: ["Paid", "Unpaid"],
    datasets: [
      {
        label: "Invoice Status",
        data: [paidCount, unpaidCount],
        backgroundColor: ["rgba(54, 162, 235, 0.7)", "rgba(255, 99, 132, 0.7)"],
        borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  };

  if (!user) {
    return <p>Loading... Please log in to view invoices.</p>;
  }

  return (
    <main className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Header Title */}
      <div className="head-title flex justify-between items-center mb-12 bg-gradient-to-r from-blue-800 to-blue-600 p-8 rounded-2xl shadow-2xl">
        <div className="left">
          <h1 className="text-5xl font-bold text-white">Invoice Dashboard</h1>
          <ul className="breadcrumb flex space-x-3 text-sm text-white-400">
            <li>
              <a href="#" className="text-white hover:text-blue-400">
                Dashboard
              </a>
            </li>
            <li>
              <i className="bx bx-chevron-right text-gray-400"></i>
            </li>
            <li>
              <a href="#" className="text-white hover:text-blue-400">
                Invoices
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Info Boxes for Stats */}
      <ul className="box-info grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        <li>
          <InfoBox
            title="Total Invoices"
            value={totalInvoices}
            description="Total Invoices Created"
            color="from-blue-600 via-blue-700 to-blue-800"
          />
        </li>
        <li>
          <InfoBox
            title="Paid Invoices"
            value={paidCount}
            description="Invoices Paid"
            color="from-green-600 via-green-700 to-green-800"
          />
        </li>
        <li>
          <InfoBox
            title="Unpaid Invoices"
            value={unpaidCount}
            description="Invoices Pending Payment"
            color="from-red-600 via-red-700 to-red-800"
          />
        </li>
      </ul>

      {/* Layout with Two Columns */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        {/* Invoice Table */}
        <div className="invoice-table bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-lg">
  <h3 className="text-xl font-semibold text-gray-100 mb-6">Invoices</h3>
  <table className="min-w-full table-auto text-gray-100">
    <thead className="bg-blue-900">
      <tr>
        <th className="px-6 py-4 text-left text-white">No</th>
        <th className="px-6 py-4 text-left text-white">Client</th>
        <th className="px-6 py-4 text-left text-white">Amount</th>
        <th className="px-6 py-4 text-left text-white">Date</th>
        <th className="px-6 py-4 text-left text-white">Status</th>
      </tr>
    </thead>
    <tbody>
      {invoices.slice(-5).map((invoice, index) => (
        <tr key={invoice.id}>
          <td className="px-6 py-4">{index + 1}</td>
          <td className="py-3 px-4">{invoice.billTo?.name}</td>
          <td className="py-3 px-4">
            ₹{(invoice.products || []).reduce((acc, p) => acc + p.total, 0)}
          </td>
          <td className="py-3 px-4">
            {new Date(invoice.invoiceDate).toLocaleDateString()}
          </td>
          <td className="px-6 py-4">{invoice.paymentStatus}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        {/* Pie Chart */}
        <div className="chart-container bg-gradient-to-r from-white-900 via-white-700 to-white-800 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">
            Invoice Status Distribution
          </h3>
          <div className="w-full max-w-xs mx-auto">
            <Pie data={invoiceData} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default InvoiceControl;
