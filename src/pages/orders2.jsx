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
function Orders2(order ) {
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
  const [status, setStatus] = useState(order.status);
  const [statusFilter, setStatusFilter] = useState("");

  const [filteredOrderss, setFilteredOrders] = useState(orders);
  const [filter, setFilter] = useState(""); 

  const handlePaidStatusFilter = (status) => {
    setFilter(status);

    if (status === "Paid") {
      const paidOrders = orders.filter((order) => order.status === "Delivered");
      console.log("Paid Orders:", paidOrders);
      setFilteredOrders(paidOrders);
    } else if (status === "Unpaid") {
      const unpaidOrders = orders.filter((order) => order.status !== "Delivered");
      console.log("Unpaid Orders:", unpaidOrders);
      setFilteredOrders(unpaidOrders);
    } else {
      setFilteredOrders(orders);
    }
  };

  useEffect(() => {
    // Set all orders as default on mount
    setFilteredOrders(orders);
  }, [orders]);
  
  
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleBulkMarkPaid = () => {
    setOrders(
      orders.map((order) =>
        selectedOrders.includes(order.id) ? { ...order, paid: true } : order
      )
    );
    setSelectedOrders([]); 
  };
  const handleExportOrders = () => {
    const csvContent = [
      ["Order ID", "Customer", "Total", "Status", "Paid"],
      ...filteredOrders.map((order) => [
        order.id,
        order.fullName,
        order.productName,
        order.totalAmount,
        order.status,
       
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
  const [highlightedOrderId, setHighlightedOrderId] = useState(null); 

  const handleNotificationClick = (orderId) => {
    console.log("Notification clicked, highlightedOrderId:", orderId);
    setHighlightedOrderId(orderId);  
  };
  const [loading, setLoading] = useState(true);
  useEffect(() => {
   
  }, [highlightedOrderId]); 
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const usersCollection = await getDocs(collection(db, "users"));
        const ordersData = [];

        for (const user of usersCollection.docs) {
          const userEmail = user.id;

          // Fetch 'Cart order' subcollection
          const cartSnapshot = await getDocs(
            collection(db, "users", userEmail, "cart order")
          );
          cartSnapshot.forEach((doc) =>
            ordersData.push({
              id: doc.id,
              userEmail,
              orderType: "Cart",
              ...doc.data(),
            })
          );
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
  const handleCheckboxChange = (orderId) => {
    setSelectedOrders((prevSelectedOrders) => {
      if (prevSelectedOrders.includes(orderId)) {
        return prevSelectedOrders.filter((id) => id !== orderId);
      } else {
        return [...prevSelectedOrders, orderId];
      }
    });
  };

  const handleBulkMarkDelivered = async () => {
    try {
      for (const orderId of selectedOrders) {
        await handleStatusChange(orderId, "Delivered"); // Mark each selected order as Delivered
      }
      setSelectedOrders([]); // Clear selection after bulk action
    } catch (error) {
      console.error("Error marking orders as delivered:", error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const order = filteredOrders.find((order) => order.id === orderId);
      if (!order || !order.userEmail || !order.orderType) {
        console.error('Missing userEmail or orderType in order:', order);
        return;
      }

      const orderRef = doc(db, "users", order.userEmail, `${order.orderType.toLowerCase()} order`, orderId);
      await updateDoc(orderRef, { status: newStatus });

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
   
  };
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.fullName && order.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.userEmail && order.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));
      
  
    const matchesStatus = statusFilter === "" || order.status === statusFilter;
  
    return matchesSearch && matchesStatus;
  });
  
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
            onClick={() => handleStatusFilter("Shipped")}
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
  onClick={() => handleStatusFilter("Delivered")}
  className="p-2 bg-green-400 text-green-700 rounded-lg hover:bg-green-500"
>
  Show Paid
</button>
<button
  onClick={() => handleStatusFilter("Shipped")}
  className="p-2 bg-red-400 text-red-700 rounded-lg hover:bg-red-500"
>
  Show Unpaid
</button>

        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {filteredOrders.map((order) => {
        const isHighlighted = String(highlightedOrderId) === String(order.id);
       

        return (
          <div
            key={order.id}
            className={`border rounded-lg p-6 shadow-lg hover:shadow-2xl transition duration-300 ${
              isHighlighted
                ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white"
                : "bg-white"
            }`}
          >
      
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-indigo-600"
            onChange={() => console.log(`Checkbox toggled for ${order.id}`)}
          />
          <h3 className="text-xl font-semibold text-indigo-600">
            {order.fullName || order.userEmail}
          </h3>
        </div>
        <p className="text-gray-600">
          <strong>Order ID:</strong> {order.id}
        </p>
        {/* <p className="text-gray-600">
          <strong>Product Details:</strong> {order.productName || "N/A"}
        </p> */}
        <p className="text-gray-600">
  <strong>Order Date:</strong> {order.orderDate ? order.orderDate : (order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A")}
</p>

        <p className="text-l mt-2">
          <strong>Status:</strong>
          <span
            className={`text-${
              order.status === "Shipped"
                ? "blue"
                : order.status === "Delivered"
                ? "green"
                : "gray"
            }-700 font-bold`}
          >
            {order.status}
          </span>
        </p>
        <div className="mt-4 space-x-2">
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
    );
  })}
</div>


      <div className="mt-4">
      <button
          onClick={handleBulkMarkDelivered}
          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Mark Selected Orders as Delivered
        </button>
      </div>

      {selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
    <div className="bg-white shadow-xl p-7 rounded-lg max-w-3xl w-full space-y-1 ">
      {/* Modal Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-2xl font-semibold text-indigo-700">
          Invoice #{selectedOrder.id}
        </h2>
        <button
          onClick={handleCloseModal}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-gray-300 transition"
        >
          Close
        </button>
      </div>

      {/* Customer Details */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">Customer Details</h3>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3 border">Field</th>
              <th className="py-2 px-3 border">Billing Details</th>
              <th className="py-2 px-3 border">Shipping Details</th>
            </tr>
          </thead>
          <tbody>
            {[
              "fullName",
              "email",
              "phoneNumber",
              "address1",
             // "address2",
             // "country",
              "zipCode",
            ].map((field, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="py-2 px-3 border capitalize text-gray-700">{field}</td>
                <td className="py-2 px-3 border text-gray-600">
                  {selectedOrder.billingAddress[field] || "-"}
                </td>
                <td className="py-2 px-3 border text-gray-600">
                  {selectedOrder.shippingAddress[field] || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Summary */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-3 border">Product Name</th>
              <th className="py-2 px-3 border">Quantity</th>
              <th className="py-2 px-3 border">Price</th>
              <th className="py-2 px-3 border">Subtotal</th>
            </tr>
          </thead>
          <tbody>
      {/* Loop through cartItems */}
      {selectedOrder.cartItems?.map((item, index) => (
        <tr key={index}>
          <td className="py-2 px-4 border">{item.name}</td>
          <td className="py-2 px-4 border">{item.quantity}</td>
          <td className="py-2 px-4 border">{item.price}</td>
          <td className="py-2 px-4 border">
            {item.quantity * parseFloat(item.price)}
          </td>
        </tr>
      ))}

      {/* Conditionally render additional row for selectedOrder fields */}
      {selectedOrder.productName && (
        <tr>
          <td className="py-2 px-4 border">{selectedOrder.productName}</td>
          <td className="py-2 px-4 border">{selectedOrder.quantity}</td>
          <td className="py-2 px-4 border">{selectedOrder.price}</td>
          <td className="py-2 px-4 border">
            {selectedOrder.quantity * parseFloat(selectedOrder.price)}
          </td>
        </tr>
      )}
    </tbody>
        </table>
      </div>

      {/* Payment Details */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">Payment Details</h3>
        <table className="w-full border text-sm">
          <tbody>
            <tr>
              <td className="py-2 px-3 border">Subtotal</td>
              <td className="py-2 px-3 border">₹ {selectedOrder.subtotal}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 px-3 border">GST</td>
              <td className="py-2 px-3 border">₹ {selectedOrder.gst}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 border">Discount</td>
              <td className="py-2 px-3 border">₹ {selectedOrder.discount}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 px-3 border">Shipping Charge</td>
              <td className="py-2 px-3 border">₹ {selectedOrder.shippingCharge}</td>
            </tr>
            <tr className="font-bold">
              <td className="py-2 px-3 border">Total Amount</td>
              <td className="py-2 px-3 border">₹ {selectedOrder.totalAmount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {/* <button
          onClick={() => alert("Order marked as paid")}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          Mark as Paid
        </button> */}
        {/* <button
          onClick={() => alert("Order has been cancelled")}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Cancel Order
        </button> */}
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default Orders2;
