import React, { useState ,useEffect} from "react";
import { getAuth } from "firebase/auth"; // Import getAuth
import { db} from "../config/firebase"; // Firebase setup file
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
function Orders2() {
  const [orders, setOrders] = useState([
    {
      id: 1,
      customer: "John Doe",
      total: 100,
      status: "Pending",
      paid: false,
      items: [
        { name: "Product 1", price: 50, quantity: 1 },
        { name: "Product 2", price: 50, quantity: 1 },
      ],
    },
    {
      id: 2,
      customer: "Jane Smith",
      total: 200,
      status: "Shipped",
      paid: true,
      items: [{ name: "Product 3", price: 100, quantity: 2 }],
    },
    {
      id: 3,
      customer: "Mark Lee",
      total: 150,
      status: "Pending",
      paid: false,
      items: [{ name: "Product 4", price: 75, quantity: 2 }],
    },
    {
      id: 4,
      customer: "Alice Brown",
      total: 300,
      status: "Delivered",
      paid: true,
      items: [
        { name: "Product 5", price: 100, quantity: 2 },
        { name: "Product 6", price: 100, quantity: 1 },
      ],
    },
    {
      id: 5,
      customer: "Bob Martin",
      total: 250,
      status: "Shipped",
      paid: false,
      items: [
        { name: "Product 7", price: 50, quantity: 3 },
        { name: "Product 8", price: 50, quantity: 2 },
      ],
    },
    {
      id: 6,
      customer: "Emily White",
      total: 120,
      status: "Pending",
      paid: false,
      items: [{ name: "Product 9", price: 40, quantity: 3 }],
    },
  ]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filteredStatus, setFilteredStatus] = useState("");
  const [filteredPaidStatus, setFilteredPaidStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setFilteredStatus(status);
  };

  const handlePaidStatusFilter = (status) => {
    setFilteredPaidStatus(status);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleCheckboxChange = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleBulkMarkPaid = () => {
    setOrders(
      orders.map((order) =>
        selectedOrders.includes(order.id) ? { ...order, paid: true } : order
      )
    );
    setSelectedOrders([]); // Clear selection after bulk action
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filteredStatus
      ? order.status === filteredStatus
      : true;
  
    const matchesPaidStatus = filteredPaidStatus
      ? (filteredPaidStatus === "Paid" && order.paid) ||
        (filteredPaidStatus === "Unpaid" && !order.paid)
      : true;
  
    const matchesSearch = order.customer?.toLowerCase().includes(searchQuery.toLowerCase());
  
    return matchesStatus && matchesPaidStatus && matchesSearch;
  });
  
  const handleExportOrders = () => {
    const csvContent = [
      ["Order ID", "Customer", "Total", "Status", "Paid"],
      ...filteredOrders.map((order) => [
        order.id,
        order.customer,
        order.total,
        order.status,
        order.paid ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "orders.csv";
    link.click();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const usersCollection = await getDocs(collection(db, "users"));
        const ordersData = [];

        for (const user of usersCollection.docs) {
          const userEmail = user.id;

          // Fetch 'Cart order' subcollection
          const cartSnapshot = await getDocs(
            collection(db, "users", userEmail, "Cart order")
          );
          cartSnapshot.forEach((doc) =>
            ordersData.push({
              id: doc.id,
              userEmail,
              orderType: "Cart",
              ...doc.data(),
            })
          );

          // Fetch 'buynow order' subcollection
          const buyNowSnapshot = await getDocs(
            collection(db, "users", userEmail, "buynow order")
          );
          buyNowSnapshot.forEach((doc) =>
            ordersData.push({
              id: doc.id,
              userEmail,
              orderType: "BuyNow",
              ...doc.data(),
            })
          );
        }

        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return <p className="text-center text-gray-600">No orders found.</p>;
  }
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-indigo-600">Orders</h1>

      {/* Search and Filter Controls */}
      <div className="flex justify-between items-center space-x-4 mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search by customer"
            value={searchQuery}
            onChange={handleSearchChange}
            className="p-2 border border-indigo-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleClearSearch}
            className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Clear Search
          </button>
          <button
            onClick={() => handleStatusFilter("")}
            className="p-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300"
          >
            All
          </button>
          <button
            onClick={() => handleStatusFilter("Pending")}
            className="p-2 bg-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-500"
          >
            Pending
          </button>
          <button
            onClick={() => handleStatusFilter("Shipped")}
            className="p-2 bg-green-400 text-green-700 rounded-lg hover:bg-green-500"
          >
            Shipped
          </button>
          <button
            onClick={() => handleStatusFilter("Delivered")}
            className="p-2 bg-blue-400 text-blue-700 rounded-lg hover:bg-blue-500"
          >
            Delivered
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportOrders}
            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Export Orders
          </button>
          <button
            onClick={() => handlePaidStatusFilter("Paid")}
            className="p-2 bg-green-400 text-green-700 rounded-lg hover:bg-green-500"
          >
            Show Paid
          </button>
          <button
            onClick={() => handlePaidStatusFilter("Unpaid")}
            className="p-2 bg-red-400 text-red-700 rounded-lg hover:bg-red-500"
          >
            Show Unpaid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded-lg p-6 shadow-lg hover:shadow-2xl transition duration-300"
        >
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
            />
            <h3 className="text-xl font-semibold text-indigo-600">
              {order.fullName || order.userEmail}
            </h3>
            <h3 className="text-xl font-semibold text-indigo-600">
              {order.fullName}
            </h3>
          </div>
          <p className="text-gray-600">
            <strong>Order ID:</strong> {order.id}
          </p>
          <p className="text-gray-600">
            <strong>Product Details:</strong> {order.productName || order.name ||"N/A"}
          </p>
          <p className="text-gray-600">
  <strong>Order Date:</strong> {order.orderDate || order.createdAt || "N/A"}
</p>

          {/* <p className="text-sm mt-2">
            <strong>Status:</strong>{" "}
            <span
              className={`text-${
                order.status === "Shipped"
                  ? "green"
                  : order.status === "Pending"
                  ? "yellow"
                  : "blue"
              }-600`}
            >
              {order.status || "Unknown"}
            </span>
            </p> */}
            <div className="mt-4 space-x-2">
              {/* Action Buttons */}
            
                <button
                  onClick={() => handleStatusChange(order.id, "Shipped")}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Mark as Shipped
                </button>
             
             
                <button
                  onClick={() => handleStatusChange(order.id, "Delivered")}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Mark as Delivered
                </button>
          
              <button
                onClick={() => handleViewDetails(order)}
                className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions for Paid Orders */}
      <div className="mt-4">
        <button
          onClick={handleBulkMarkPaid}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Mark Selected Orders as Paid
        </button>
      </div>

      {/* Modal for Invoice View */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-indigo-600">
                Invoice #{selectedOrder.id}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <p>
                  <strong>Customer:</strong> {selectedOrder.customer}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
              </div>
              <div className="flex justify-between">
                <p>
                  <strong>Total:</strong> ${selectedOrder.total}
                </p>
                <p>
                  <strong>Paid:</strong> {selectedOrder.paid ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border">Item</th>
                    <th className="py-2 px-4 border">Quantity</th>
                    <th className="py-2 px-4 border">Price</th>
                    <th className="py-2 px-4 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border">{item.name}</td>
                      <td className="py-2 px-4 border">{item.quantity}</td>
                      <td className="py-2 px-4 border">${item.price}</td>
                      <td className="py-2 px-4 border">
                        ${item.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Additional controls */}
            <div className="flex space-x-4">
              <button
                onClick={() => alert("Order marked as paid")}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => alert("Order has been cancelled")}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders2;
