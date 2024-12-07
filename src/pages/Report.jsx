import { useState } from "react";
import { FaRegChartBar } from "react-icons/fa"; // Icon for the report
import { FaShoppingCart, FaChartLine, FaStore, FaUsers, FaFileInvoice } from "react-icons/fa"; // More icons for tabs
import {  useEffect } from "react";

import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { doc, collection, getDocs } from "firebase/firestore";
import { db,auth } from "../config/firebase"; // Assuming you have your firebase setup
const ReportTabs = () => {
  const [activeTab, setActiveTab] = useState("purchase");

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const currentUser = auth.currentUser;
  
  // Fetch products on component mount or when user changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, "admins", curentUser.email);
        const productsRef = collection(userDocRef, "Purchase");
        const productSnapshot = await getDocs(productsRef);
        const productList = productSnapshot.docs.map((doc) => doc.data());
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };

    fetchProducts();
  }, [currentUser]);
  
  // Filter the products based on active tab
  useEffect(() => {
    if (activeTab === "purchase") {
      setFilteredProducts(products); // Only set products for the purchase tab
    }
  }, [activeTab, products]);
  const handleRemoveProduct = (productPhone) => {
    // Logic to remove product from firestore (example)
    console.log("Removing product with phone:", productPhone);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-300 p-6 text-gray-900 font-sans">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <FaRegChartBar className="text-4xl animate-pulse text-indigo-600" />
        <h1 className="text-5xl font-extrabold tracking-wide text-gray-800">
          Reports Dashboard
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex justify-start space-x-6 mb-8">
        <button
          onClick={() => handleTabChange("purchase")}
          className={`flex items-center px-6 py-4 rounded-lg font-semibold transition-all ${
            activeTab === "purchase"
              ? "bg-green-500 text-white"
              : "bg-gray-200 hover:bg-opacity-80 hover:text-white"
          }`}
        >
          <FaShoppingCart className="mr-3 text-2xl" />
          <span className="text-lg">Purchase</span>
        </button>
      
        <Tab
          label="Sales"
          icon={<FaChartLine />}
          isActive={activeTab === "sales"}
          onClick={() => handleTabChange("sales")}
          color="bg-blue-500"
        />
        <Tab
          label="Stocks"
          icon={<FaStore />}
          isActive={activeTab === "stocks"}
          onClick={() => handleTabChange("stocks")}
          color="bg-yellow-500"
        />
        <Tab
          label="Invoices"
          icon={<FaFileInvoice />}
          isActive={activeTab === "invoices"}
          onClick={() => handleTabChange("invoices")}
          color="bg-purple-500"
        />
        <Tab
          label="Customer"
          icon={<FaUsers />}
          isActive={activeTab === "customer"}
          onClick={() => handleTabChange("customer")}
          color="bg-indigo-500"
        />
        <Tab
          label="Business"
          icon={<FaStore />}
          isActive={activeTab === "business"}
          onClick={() => handleTabChange("business")}
          color="bg-pink-500"
        />
       
      </div>

      {/* Content based on active tab */}
      <div className="p-4 mt-6 bg-white rounded-lg shadow-lg">
        {/* Product Table */}
 {activeTab === "purchase" && (
    <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
      <table className="min-w-full bg-white border border-gray-200 shadow-md">
        <thead className="bg-gradient-to-r from-blue-700 to-blue-700 text-white">
          <tr>
            <th className="py-3 px-4 text-left">P.No</th>
            <th className="py-3 px-4 text-left">Supplier</th>
            <th className="py-3 px-4 text-left">Phone</th>
            <th className="py-3 px-4 text-left">Address</th>
            <th className="py-3 px-4 text-left">Product Name</th>
            <th className="py-3 px-4 text-left">Existing Stock</th>
            <th className="py-3 px-4 text-left">Unit Price</th>
            <th className="py-3 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr
              key={product.phone}
              className="hover:bg-yellow-100 transition duration-300"
            >
              <td className="py-3 px-4">{product.no}</td>
              <td className="py-3 px-4">{product.sname}</td>
              <td className="py-3 px-4">{product.phone}</td>
              <td className="py-3 px-4">{product.add}</td>
              <td className="py-3 px-4">{product.pname}</td>
              <td className="py-3 px-4 text-left">{product.estock}</td>
              <td className="py-3 px-4">{product.price}</td>
              <td className="py-3 px-4">
                <button
                  onClick={() => {
                    setShowModal(true);
                    setEditMode(true);
                    setNewProduct(product);
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <AiOutlineEdit />
                </button>
                <button
                  onClick={() => handleRemoveProduct(product.phone)}
                  className="text-red-500 hover:text-red-700 ml-4"
                >
                  <AiOutlineDelete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
        {activeTab === "sales" && <p className="text-lg text-gray-700">Sales Content</p>}
        {activeTab === "stocks" && <p className="text-lg text-gray-700">Stocks Content</p>}
        {activeTab === "invoices" && <p className="text-lg text-gray-700">Invoices Content</p>}
        {activeTab === "customer" && <p className="text-lg text-gray-700">Customer Content</p>}
        {activeTab === "business" && <p className="text-lg text-gray-700">Business Content</p>}
    
      </div>
    </div>
  );
};

// Tab component to reuse for each tab with icon
const Tab = ({ label, icon, isActive, onClick, color }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-6 py-4 text-black rounded-lg font-semibold transition-all hover:transform hover:scale-105 ${
        isActive
          ? `${color} shadow-lg scale-110`
          : "bg-gray-300 hover:bg-opacity-80 "
      }`}
    >
      <span className="mr-3 text-2xl">{icon}</span>
      <span className="text-lg">{label}</span>
    </button>
  );
};

export default ReportTabs;
