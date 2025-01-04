import { Link } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { useState, useEffect } from "react";
import { collection, getDocs, doc  } from "firebase/firestore"; // Firestore functions for querying
import { db } from "../config/firebase";

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

const Dashboard = (userEmail) => {
  // WhatsApp click handler
  const handleWhatsAppClick = () => {
    const phoneNumber = "+1234567890"; // Replace with your actual phone number
    const message = "Hello, I need assistance."; // Predefined message
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank"); // Opens WhatsApp Web in a new tab
  };

  // Example Pie chart data for sales performance
  const salesData = {
    labels: ["Electronics", "Fashion", "Home", "Toys", "Beauty"],
    datasets: [
      {
        label: "Sales ($)",
        data: [5000, 3000, 4000, 2500, 2000],
        backgroundColor: [
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 99, 132, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Example recent orders data (can be fetched from a database)
  const [orders, setOrders] = useState([]);

  // Example function to simulate fetching orders from a database
  useEffect(() => {
    // Simulated fetch
    const fetchOrders = async () => {
      const fakeOrders = [
        // { id: 1, customer: "John Doe", total: "$200", status: "Shipped" },
        // { id: 2, customer: "Jane Smith", total: "$350", status: "Pending" },
        // { id: 3, customer: "Sara Lee", total: "$120", status: "Shipped" },
        // {
        //   id: 4,
        //   customer: "Robert Brown",
        //   total: "$500",
        //   status: "Processing",
        // },
      ];
      setOrders(fakeOrders);
    };
    fetchOrders();
  }, []);

 const [productsInStock, setProductsInStock] = useState(0);

 useEffect(() => {
  const fetchProductsInStock = async () => {
    // Reference to the collection where products are stored
    const productsCollectionRef = collection(db, "products");

    try {
      // Fetch all product documents from Firestore
      const querySnapshot = await getDocs(productsCollectionRef);

      // Calculate the number of products in stock (assuming each product has a 'stock' field)
      const inStockCount = querySnapshot.docs.reduce(
        (acc, doc) => {
          const product = doc.data();
          return acc + (parseInt(product.stock, 10) > 0 ? 1 : 0);
        },
        0
      );

      // Update the state with the count of products in stock
      setProductsInStock(inStockCount);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  fetchProductsInStock(); // Call the function to fetch products count
}, []);


const [categoriesInStock, setCategoriesInStock] = useState(0); // State for the category count

 // Fetch categories count from Firestore
 useEffect(() => {
  const fetchCategoriesCount = async () => {
    try {
      // Reference to the 'categories' collection in Firestore
      const categoriesCollectionRef = collection(db, "categories");

      // Fetch all category documents from Firestore
      const querySnapshot = await getDocs(categoriesCollectionRef);

      // Set the category count
      setCategoriesInStock(querySnapshot.size); // 'size' gives the count of documents
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  fetchCategoriesCount(); // Call the function to fetch the categories count
}, []);


const [totalOrders, setTotalOrders] = useState(0); // Initialize totalOrders state

useEffect(() => {
  const fetchTotalOrders = async () => {
    try {
      // Reference to the user's 'buynow order' collection
      const userDocRef = doc(db, "users", userEmail);
      const buynowCollectionRef = collection(userDocRef, "buynow order");

      // Reference to the user's 'Cart order' collection
      const cartCollectionRef = collection(userDocRef, "Cart order");

      // Fetch documents from both collections
      const buynowQuerySnapshot = await getDocs(buynowCollectionRef);
      const cartQuerySnapshot = await getDocs(cartCollectionRef);

      // Calculate total orders by combining lengths of both collections
      const total = buynowQuerySnapshot.size + cartQuerySnapshot.size;

      // Set the total orders state
      setTotalOrders(total);
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  fetchTotalOrders(); // Call the function to fetch the total orders

}, [userEmail]); // Re-run the effect when userEmail changes


  return (
    <main className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Header Title */}
      <div className="head-title flex justify-between items-center mb-12 bg-gradient-to-r from-blue-800 to-blue-600 p-8 rounded-2xl shadow-2xl">
        <div className="left">
          <h1 className="text-5xl font-bold text-white">
            E-commerce Dashboard
          </h1>
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
                Home
              </a>
            </li>
          </ul>
        </div>
        <a
          href="#"
          className="btn-download flex items-center bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gradient-to-r hover:from-orange-600 hover:to-orange-700 transition duration-300"
        >
          <i className="bx bxs-cloud-download"></i>
          <span className="ml-3">Download Report</span>
        </a>
      </div>

      {/* Info Boxes for E-commerce Stats */}
      <ul className="box-info grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
         {/* Orders Info Box */}
         <li>
          <InfoBox
            title="Total Orders"
            value={totalOrders}
            description="Total Orders Processed"
            color="from-orange-600 via-orange-700 to-orange-800"
          />
        </li>

         {/* Total Categories Info Box */}
         <li>
            <InfoBox
              title="Categories in Stock"
              value={categoriesInStock} // Displaying the dynamic count here
              description="Total Categories Available"
              color="from-blue-600 via-blue-700 to-blue-800"
            />
          </li>

        {/* Total Products Info Box  */}
        <li>
            <InfoBox
              title="Products in Stock"
              value={productsInStock}
              description="Total Products Available"
              color="from-green-600 via-green-700 to-green-800"
            />
          </li>
        
      </ul>

      {/* Layout with Two Columns: Pie Chart and Orders Table */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        {/* Left Column: Recent Orders Table */}
        <div className="recent-orders-table bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-100 mb-6">
            Recent Orders
          </h3>
          <table className="min-w-full table-auto text-gray-100">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-6 py-4 text-left text-white">Order ID</th>
                <th className="px-6 py-4 text-left text-white">Order Date</th>
                {/* <th className="px-6 py-4 text-left text-white">Customer</th> */}
                <th className="px-6 py-4 text-left text-white">Final Total</th>
                <th className="px-6 py-4 text-left text-white">Payment Method</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4">{order.id}</td>
                  {/* <td className="px-6 py-4">{order.customer}</td> */}
                  <td className="px-6 py-4">{order.total}</td>
                  <td className="px-6 py-4">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Pie Chart */}
        <div className="chart-container bg-gradient-to-r from-white-900 via-white-700 to-white-800 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">
            Sales Performance
          </h3>
          <div className="w-full max-w-xs mx-auto">
            <Pie data={salesData} />
          </div>
        </div>
      </div>

      {/* Additional Controls for E-commerce Management */}
      <div className="dashboard-controls grid grid-cols-4 md:grid-cols-2 lg:grid-cols-2 gap-12 mb-16">
        {/* Inventory Management */}
        <div className="control-card p-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">
            Inventory Management
          </h3>
          <p className="text-gray-100">
            Manage your inventory, stock, and suppliers.
          </p>
          <Link
            to="/e-commerce/inventory"
            className="btn btn-primary mt-4 text-white bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Manage Inventory
          </Link>
        </div>

        {/* Order Management */}
        <div className="control-card p-6 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">Order Management</h3>
          <p className="text-gray-100">
            Track and manage customer orders and returns.
          </p>
          <Link
            to="/e-commerce/orders"
            className="btn btn-primary mt-4 text-white bg-orange-600 px-6 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            Manage Orders
          </Link>
        </div>

        {/* Customer Management */}
        <div className="control-card p-6 bg-gradient-to-r from-green-600 via-green-700 to-green-800 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">
            Customer Management
          </h3>
          <p className="text-gray-100">
            View customer profiles and their order history.
          </p>
          <Link
            to="/e-commerce/customers"
            className="btn btn-primary mt-4 text-white bg-green-600 px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Manage Customers
          </Link>
        </div>

        {/* Discount and Coupon Management */}
        <div className="control-card p-6 bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">
            Discounts & Coupons
          </h3>
          <p className="text-gray-100">
            Create and manage discount codes for customers.
          </p>
          <Link
            to="/e-commerce/discounts"
            className="btn btn-primary mt-4 text-white bg-yellow-600 px-6 py-2 rounded-lg hover:bg-yellow-700 transition"
          >
            Manage Discounts
          </Link>
        </div>
      </div>

      {/* WhatsApp Chat Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleWhatsAppClick}
          className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition duration-300"
        >
          <i className="bx bxl-whatsapp text-3xl"></i>
        </button>
      </div>
    </main>
  );
};

export default Dashboard;
