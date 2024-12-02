import React, { useState, useEffect } from "react";
import { db } from "../config/firebase"; // Firebase setup file
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    orderId: "",
    customerName: "",
    status: "",
    totalAmount: "",
    date: "",
  });
  const [editOrderId, setEditOrderId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state

  // Reference to Firestore collection
  const ordersCollection = collection(db, "AddToCart");

  // Fetch orders from Firebase
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getDocs(ordersCollection); // Fetching data from Firestore
        setOrders(data.docs.map((doc) => ({ ...doc.data(), id: doc.id }))); // Mapping fetched data to local state
      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setLoading(false); // Stop loading when data is fetched
      }
    };
    fetchOrders();
  }, []); // The empty dependency array ensures this effect runs only once when the component mounts

  // Add a new order
  const handleAddOrder = async () => {
    try {
      const newDoc = await addDoc(ordersCollection, newOrder); // Add a new order to Firestore
      setOrders([...orders, { ...newOrder, id: newDoc.id }]); // Update local state with new order
      resetForm(); // Reset the form fields
    } catch (error) {
      console.error("Error adding order: ", error);
    }
  };

  // Update an existing order
  const handleUpdateOrder = async () => {
    try {
      const orderDoc = doc(db, "AddToCart", editOrderId); // Reference to the order to be updated
      await updateDoc(orderDoc, newOrder); // Update the order document in Firestore
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === editOrderId ? { ...order, ...newOrder } : order
        )
      ); // Update local state with new order details
      resetForm(); // Reset the form fields
    } catch (error) {
      console.error("Error updating order: ", error);
    }
  };

  // Delete an order
  const handleDeleteOrder = async (id) => {
    try {
      const orderDoc = doc(db, "AddToCart", id); // Reference to the order to be deleted
      await deleteDoc(orderDoc); // Delete the order from Firestore
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id)); // Update local state to remove the deleted order
    } catch (error) {
      console.error("Error deleting order: ", error);
    }
  };

  // Reset the form
  const resetForm = () => {
    setNewOrder({
      orderId: "",
      customerName: "",
      status: "",
      totalAmount: "",
      date: "",
    });
    setEditOrderId(null); // Reset the edit order ID
    setPreviewImage(null); // Reset image preview
  };

  // Info Box Calculations
  const totalOrders = orders.length;
  const totalRevenue = orders
    .reduce((acc, order) => acc + parseFloat(order.totalAmount || 0), 0)
    .toFixed(2);
  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
        Manage Orders
      </h1>

      {/* Info Boxes */}
      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Total Orders</h2>
          <p className="text-3xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Total Revenue</h2>
          <p className="text-3xl font-bold">${totalRevenue}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Pending Orders</h2>
          <p className="text-3xl font-bold">{pendingOrders}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Completed Orders</h2>
          <p className="text-3xl font-bold">{completedOrders}</p>
        </div>
      </div>

      {/* Loading state */}
      {loading && <div>Loading orders...</div>}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-8">
        {/* Order Form Column */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            {editOrderId ? "Edit Order" : "Add New Order"}
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Order ID"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.orderId}
              onChange={(e) =>
                setNewOrder({ ...newOrder, orderId: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Customer Name"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.customerName}
              onChange={(e) =>
                setNewOrder({ ...newOrder, customerName: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Order Status"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.status}
              onChange={(e) =>
                setNewOrder({ ...newOrder, status: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Total Amount"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.totalAmount}
              onChange={(e) =>
                setNewOrder({ ...newOrder, totalAmount: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.date}
              onChange={(e) =>
                setNewOrder({ ...newOrder, date: e.target.value })
              }
            />
          </div>
          <div className="mt-4 flex justify-between">
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
              onClick={editOrderId ? handleUpdateOrder : handleAddOrder}
            >
              {editOrderId ? "Update Order" : "Add Order"}
            </button>
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
              onClick={resetForm}
            >
              Clear Form
            </button>
          </div>
        </div>

        {/* Order List Column */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            Order List
          </h2>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100 text-blue-700">
                <th className="border p-3">Order ID</th>
                <th className="border p-3">Customer Name</th>
                <th className="border p-3">Status</th>
                <th className="border p-3">Total Amount</th>
                <th className="border p-3">Date</th>
                <th className="border p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No orders available.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-100 transition">
                    <td className="border p-3">{order.orderId}</td>
                    <td className="border p-3">{order.customerName}</td>
                    <td className="border p-3">{order.status}</td>
                    <td className="border p-3">${order.totalAmount}</td>
                    <td className="border p-3">{order.date}</td>
                    <td className="border p-3 flex justify-around">
                      <FontAwesomeIcon
                        icon={faEdit}
                        className="text-yellow-500 cursor-pointer"
                        onClick={() => {
                          setEditOrderId(order.id);
                          setNewOrder(order);
                        }}
                      />
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="text-red-500 cursor-pointer"
                        onClick={() => handleDeleteOrder(order.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageOrders;
