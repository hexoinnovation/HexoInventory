// src/InventoryControl.js

import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase"; // Import Firestore instance

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
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState(0);
  const [inStockProducts, setInStockProducts] = useState(0);

  // Fetch data from Firestore on mount
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Purchase"), (snapshot) => {
      const inventoryData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Set the inventory data
      setInventory(inventoryData);

      // Calculate total products, low stock products, and in-stock products
      const total = inventoryData.length;
      const lowStock = inventoryData.filter((item) => item.Purchase <= 50).length;
      const inStock = inventoryData.filter((item) => item.Purchase > 50).length;

      setTotalProducts(total);
      setLowStockProducts(lowStock);
      setInStockProducts(inStock);
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  // Pie chart data
  const stockData = {
    labels: ["Electronics", "Fashion", "Home", "Toys", "Beauty"],
    datasets: [
      {
        label: "Stock Quantity",
        data: [500, 300, 400, 250, 200],
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
        {/* Total Products Info Box */}
        <li>
          <InfoBox
            title="Total Products"
            value={totalProducts}
            description="Total Products in Inventory"
            color="from-blue-600 via-blue-700 to-blue-800"
          />
        </li>

        {/* Low Stock Info Box */}
        <li>
          <InfoBox
            title="Low Stock"
            value={lowStockProducts}
            description="Products with Low Stock"
            color="from-red-600 via-red-700 to-red-800"
          />
        </li>

        {/* In Stock Info Box */}
        <li>
          <InfoBox
            title="In Stock"
            value={inStockProducts}
            description="Products Available in Stock"
            color="from-green-600 via-green-700 to-green-800"
          />
        </li>
      </ul>

      {/* Layout with Two Columns: Pie Chart and Inventory Table */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 mb-16">
        {/* Left Column: Inventory Table */}
        <div className="inventory-table bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-100 mb-6">Inventory</h3>
          <table className="min-w-full table-auto text-gray-100">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-6 py-4 text-left text-white">No</th>
                <th className="px-6 py-4 text-left text-white">Product</th>
                <th className="px-6 py-4 text-left text-white">Stock</th>
                <th className="px-6 py-4 text-left text-white">Price</th>
                <th className="px-6 py-4 text-left text-white">Sales</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">{item.no}</td>
                  <td className="px-6 py-4">{item.pname}</td>
                  <td className="px-6 py-4">{item.estock}</td>
                  <td className="px-6 py-4">{item.price}</td>
                  <td className="px-6 py-4">{item.sales}</td>
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
