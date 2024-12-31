// src/InventoryControl.js

import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { doc,collection, onSnapshot,  getDocs} from "firebase/firestore";
import { db } from "../config/firebase"; // Import Firestore instance
import { getAuth, onAuthStateChanged } from "firebase/auth";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Info Box component for displaying stats
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

const InventoryControl = () => {
  const [inventory, setInventory] = useState([]);
  const [user, setUser] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);

  useEffect(() => {
    const fetchTotalProducts = async () => {
      try {
        if (!user) return; // Ensure the user is authenticated
        
        // Reference to the admin's "Purchase" collection
        const userDocRef = doc(db, "admins", user.email);
        const productsRef = collection(userDocRef, "Purchase");
  
        // Fetch documents from the collection
        const snapshot = await getDocs(productsRef);
        
        // Set the count of products in totalProducts state
        setTotalProducts(snapshot.size);
        console.log("Total Products count fetched: ", snapshot.size); // Debugging
      } catch (error) {
        console.error("Error fetching total products: ", error);
      }
    };
  
    fetchTotalProducts();
  }, [user]);

  // Fetch user data for auth and total products count
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInvoiceCount = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;

        const invoicesRef = collection(db, "admins", user.email, "Invoices");
        const querySnapshot = await getDocs(invoicesRef);
        setInvoiceCount(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching invoice count: ", error);
      }
    };

    fetchInvoiceCount();
  }, [getAuth().currentUser]);

  useEffect(() => {
    const fetchTotalStock = async () => {
      try {
        if (!user) return;
        const userDocRef = doc(db, "admins", user.email);
        const productsRef = collection(userDocRef, "Purchase");
        const snapshot = await getDocs(productsRef);
        const stockTotal = snapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          return acc + (parseInt(data.estock, 10) || 0);
        }, 0);
        setTotalStock(stockTotal);
      } catch (error) {
        console.error("Error fetching total stock:", error);
      }
    };

    fetchTotalStock();
  }, [user]);

  // Pie chart data based on dynamic counts
  const stockData = {
    labels: ["Total Products", "Total Stock", "Total Sales"],
    datasets: [
      {
        label: "Inventory Distribution",
        data: [totalProducts, totalStock, invoiceCount],
        backgroundColor: [
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(153,102,255,0.7)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153,102,255,1)",
        ],
        borderWidth: 1,
      },
    ],
  };


 // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const invoiceRef = collection(userDocRef, "Invoices");
        const invoiceSnapshot = await getDocs(invoiceRef);

        const invoices = invoiceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setInvoiceData(invoices);
      } catch (error) {
        console.error("Error fetching invoices: ", error);
      }
    };

    fetchData();
  }, [user]);

const [filters, setFilters] = useState({
    Bno: "",
    cname: "",
    pname: "",
    fromDate: "",
    toDate: "",
    status: "",
  });
const [invoiceData, setInvoiceData] = useState([]);
  const filteredInvoiceData = invoiceData.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate);
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
    const toDate = filters.toDate ? new Date(filters.toDate) : null;

    const isDateInRange =
      (!fromDate || invoiceDate >= fromDate) &&
      (!toDate || invoiceDate <= toDate);

    const matchesInvoiceNumber = invoice.invoiceNumber
      .toString()
      .includes(filters.Bno);
    const matchesCustomerName = invoice.billTo?.name
      .toLowerCase()
      .includes(filters.cname.toLowerCase());
    const matchesProductName = invoice.products
      .map((product) => product.description)
      .join(", ")
      .toLowerCase()
      .includes(filters.pname.toLowerCase());
    const matchesStatus =
      !filters.status ||
      invoice.status.toLowerCase() === filters.status.toLowerCase();

    return (
      isDateInRange &&
      matchesInvoiceNumber &&
      matchesCustomerName &&
      matchesProductName &&
      matchesStatus
    );
  });


  return (
    <main className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Header Title */}
      <div className="head-title flex justify-between items-center mb-12 bg-gradient-to-r from-blue-800 to-blue-600 p-8 rounded-2xl shadow-2xl">
        <div className="left">
          <h1 className="text-5xl font-bold text-white">Inventory Dashboard</h1>
          <ul className="breadcrumb flex space-x-3 text-sm text-white-400">
            <li>
              <a href="#" className="text-white hover:text-blue-400">Dashboard</a>
            </li>
            <li>
              <i className="bx bx-chevron-right text-gray-400"></i>
            </li>
            <li>
              <a href="#" className="text-white hover:text-blue-400">Inventory</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Info Boxes for Inventory Stats */}
      <ul className="box-info grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        <li>
          <InfoBox
            title="Total Products"
            value={totalProducts}
            description="Total Products in Inventory"
            color="from-blue-600 via-blue-700 to-blue-800"
          />
        </li>
        <li>
          <InfoBox
            title="Total Stock"
            value={totalStock}
            description="Total Stock in Inventory"
            color="from-red-600 via-red-700 to-red-800"
          />
        </li>
        <li>
          <InfoBox
            title="Total Sales"
            value={invoiceCount}
            description="Total Sales in Inventory"
            color="from-green-600 via-green-700 to-green-800"
          />
        </li>
      </ul>

      {/* Layout with Two Columns: Pie Chart and Inventory Table */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        <div className="inventory-table bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-100 mb-6">Inventory</h3>
          <table className="min-w-full table-auto text-gray-100">
            <thead className="bg-blue-900">
            <tr>
      <th className="py-3 px-4 text-left">UID</th>
      <th className="py-3 px-4 text-left">Date</th>
      {/* <th className="py-3 px-4 text-left">Client</th> */}
      <th className="py-3 px-4 text-left">Product Name</th>
      <th className="py-3 px-4 text-left">Sales</th>
      <th className="py-3 px-4 text-left">Total Amount</th>
      {/* <th className="py-3 px-4 text-left">Actions</th> */}
    </tr>
            </thead>
            <tbody>
    {filteredInvoiceData.map((invoice) => (
      <tr key={invoice.id} className="hover:bg-black-100">
        <td className="py-3 px-4">{invoice.invoiceNumber}</td>
        <td className="py-3 px-4">
          {new Date(invoice.invoiceDate).toLocaleDateString()}
        </td>
        {/* <td className="py-3 px-4">{invoice.billTo?.name || "N/A"}</td> */}
        <td className="py-3 px-4">
          {(invoice.products || [])
            .map((product) => product.description || "N/A")
            .join(", ")}
        </td>
        <td className="py-3 px-4">
          {(invoice.products || []).reduce(
            (acc, product) => acc + (product.quantity || 0),
            0
          )}
        </td>
        <td className="py-3 px-4">
          ₹{(invoice.products || []).reduce(
            (acc, p) => acc + p.total,
            0
          )}
        </td>
        {/* <td className="py-3 px-4">
          <button
            onClick={() => handleViewInvoice(invoice.invoiceNumber)}
            className="bg-blue-900 text-white py-1 px-3 rounded-md"
          >
            View
          </button>
        </td> */}
      </tr>
    ))}
  </tbody>
</table>
        </div>

        {/* Right Column: Pie Chart */}
        <div className="chart-container bg-gradient-to-r from-white-900 via-white-700 to-white-800 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">Stock Distribution</h3>
          <div className="w-full max-w-xs mx-auto">
            <Pie data={stockData} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default InventoryControl;


