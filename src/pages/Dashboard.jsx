import { Link } from "react-router-dom";
import TodoList from "../Components/Todolist";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { auth, db } from "../config/firebase";
import { collection, getDocs ,doc} from "firebase/firestore";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const user = auth.currentUser; // Assuming user is authenticated and available

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const productsRef = collection(userDocRef, "Purchase");
        const productSnapshot = await getDocs(productsRef);
        const productList = productSnapshot.docs.map((doc) => doc.data());

        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };

    fetchProducts();
  }, [user]);

  useEffect(() => {
    if (products.length > 0) {
      setTotalProducts(products.length);
    }
  }, [products]);

  const chartData = {
    labels: products.map((product) => product.name),
    datasets: [
      {
        label: "Product Stock",
        data: products.map((product) => product.estock),
        fill: false,
        backgroundColor: "rgba(75, 192, 192, 1)",
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
          lineWidth: 1,
        },
      },
      y: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
          lineWidth: 1,
        },
      },
    },
  };
  

  const totalStockValue = products.reduce(
    (acc, product) => acc + parseFloat(product.price || 0) * parseInt(product.estock || 0),
    0
  );

 

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

  const handleWhatsAppClick = () => {
    const phoneNumber = "+1234567890"; // Replace with your actual phone number
    const message = "Hello, I need assistance."; // Predefined message
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank"); // Opens WhatsApp Web in a new tab
  };

  return (
    <main className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      <div className="head-title flex justify-between items-center mb-12 bg-gradient-to-r from-blue-900 to-indigo-800 p-8 rounded-2xl shadow-2xl">
        <div className="left">
          <h1 className="text-5xl font-bold text-white">Dashboard</h1>
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
          className="btn-download flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 transition duration-300"
        >
          <i className="bx bxs-cloud-download"></i>
          <span className="ml-3">Download PDF</span>
        </a>
      </div>

     
      <ul className="box-info grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* Product Count */}
        <li className="info-box">
          <div className="info-content bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-800 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold">Total Products</h3>
            <p className="text-3xl font-bold">{totalProducts}</p>
            <p className="mt-2">Total Purchase Count</p>
          </div>
        </li>

        {/* Products Stock Chart */}
        <div className="chart-box flex flex-col items-center bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-800 p-6 rounded-xl shadow-lg text-white">
          <div className="chart-header mb-4">
            <h3 className="text-lg font-semibold">Products Stock Chart</h3>
          </div>
          <div className="chart-content w-full h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <li>
          <InfoBox
            title="E-commerce Sales"
            value="$5400"
            description="Total Sales this Month"
            color="from-blue-600 via-blue-700 to-blue-800"
          />
        </li>

        <li>
          <InfoBox
            title="Employees"
            value="E-350"
            description="Total Employees"
            color="from-indigo-800 via-indigo-900 to-indigo-700"
          />
        </li>
      </ul>

      <div className="dashboard-controls grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="control-card p-6 bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-800 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">Inventory Management</h3>
          <p className="text-gray-100">Manage stock, orders, and product details</p>
          <Link
            to="/inventory"
            className="btn btn-primary mt-4 text-white bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Manage Inventory
          </Link>
        </div>

        <div className="control-card p-6 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">E-commerce</h3>
          <p className="text-gray-100">Track products, orders, and customer data</p>
          <Link
            to="/e-commerce"
            className="btn btn-primary mt-4 text-white bg-blue-500 px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Manage E-commerce
          </Link>
        </div>

        <div className="control-card p-6 bg-gradient-to-r from-blue-900 via-indigo-800 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition">
          <h3 className="text-xl font-semibold text-white">HRM System</h3>
          <p className="text-gray-100">Manage employees, payroll, and attendance</p>
          <Link
            to="/hrm"
            className="btn btn-primary mt-4 text-white bg-indigo-700 px-6 py-2 rounded-lg hover:bg-indigo-800 transition"
          >
            Manage HRM
          </Link>
        </div>
      </div>

      <div className="table-data bg-gradient-to-r from-blue-600 p-8 rounded-2xl shadow-lg mb-16">
        <h3 className="text-xl font-semibold text-gray-100 mb-6">Recent Orders</h3>
        <TodoList />
      </div>

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
