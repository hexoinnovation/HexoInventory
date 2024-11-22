import axios from "axios";
import React, { useEffect, useState } from "react";

// Dummy order data (replace with API calls)
const initialOrders = [
  {
    id: 1,
    customerName: "John Doe",
    email: "john@example.com",
    products: [
      { id: 1, name: "Product 1", quantity: 2, price: 100 },
      { id: 2, name: "Product 2", quantity: 1, price: 200 }
    ],
    totalAmount: 400,
    status: "Pending",
    orderDate: "2024-11-10",
  },
  {
    id: 2,
    customerName: "Jane Smith",
    email: "jane@example.com",
    products: [
      { id: 3, name: "Product 3", quantity: 1, price: 150 }
    ],
    totalAmount: 150,
    status: "Completed",
    orderDate: "2024-11-09",
  }
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from the backend
  useEffect(() => {
    axios.get('/api/orders') // Replace with actual API call
      .then(response => {
        setOrders(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      });
  }, []);

  // Handle updating order status
  const handleUpdateStatus = (orderId, status) => {
    axios.put(`/api/orders/${orderId}`, { status })
      .then(() => {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status } : order
        ));
      })
      .catch(error => console.error("Error updating order status:", error));
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-indigo-600 mb-8">Order Management</h1>

      {/* Order List */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">All Orders</h2>

        {/* Orders Table */}
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="text-left bg-indigo-600 text-white">
              <th className="px-4 py-2">Order ID</th>
              <th className="px-4 py-2">Customer Name</th>
              <th className="px-4 py-2">Total Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-100">
                <td className="px-4 py-2">{order.id}</td>
                <td className="px-4 py-2">{order.customerName}</td>
                <td className="px-4 py-2">${order.totalAmount}</td>
                <td className="px-4 py-2">{order.status}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleUpdateStatus(order.id, "Shipped")}
                    className="text-blue-600 hover:text-blue-800 mr-2"
                  >
                    Mark as Shipped
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(order.id, "Completed")}
                    className="text-green-600 hover:text-green-800"
                  >
                    Mark as Completed
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
