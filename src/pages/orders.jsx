import React, { useState, useEffect } from "react";
import { db} from "../config/firebase"; // Firebase setup file
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
import { getAuth } from "firebase/auth"; // Import getAuth

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    orderId: "",
    customerName: "",
    status: "",
    totalAmount: "",
    date: "",
  });
  const [newOrders, setNewOrders] = useState({
    orderId: "",
    customerName: "",
    status: "",
    totalAmount: "",
    date: "",
  });
  const [editOrderId, setEditOrderId] = useState(null);
  const [editOrderIds, setEditOrderIds] = useState(null);
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


   // Update an existing order
   const handleUpdateOrders = async () => {
    try {
      const orderDoc = doc(db, "AddToCart", editOrderIds); // Reference to the order to be updated
      await updateDoc(orderDoc, newOrders); // Update the order document in Firestore
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === editOrderIds ? { ...order, ...newOrders } : order
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
      id: "",
      totalItems: "",
      paymentMethod: "",
      finalTotal: "",
      orderDate: "",
    });
    setEditOrderId(null); // Reset the edit order ID
    setPreviewImage(null); // Reset image preview
  };

  // Reset the form
  const resetForms = () => {
    setNewOrders({
      id: "",
      paymentmethod: "",
      totalamount: "",
      orderdate: "",
    });
    setEditOrderIds(null); // Reset the edit order ID
    setPreviewImage(null); // Reset image preview
  };


  // Info Box Calculations

  const totalRevenue = orders
    .reduce((acc, order) => acc + parseFloat(order.totalAmount || 0), 0)
    .toFixed(2);
  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;
  const completedOrders = orders.filter(
    (order) => order.status === "Completed"
  ).length;


  const auth = getAuth();
  const userEmail = auth.currentUser?.email;
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userDocRef = doc(db,  userEmail);
        const cartCollectionRef = collection(userDocRef, "Cart order");
  
        const querySnapshot = await getDocs(cartCollectionRef);
        const fetchedOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error.message);
      }
    };
  
    fetchOrders();
  }, [userEmail]);


  const [buyNowOrders, setBuyNowOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!userEmail) {
          console.error("User email not available");
          return;
        }

        // Reference to the user's "BuyNow order" collection
        const userDocRef = doc(db,  userEmail);
        const buynowCollectionRef = collection(userDocRef, "buynow order");

        // Fetch BuyNow orders
        const buynowSnapshot = await getDocs(buynowCollectionRef);
        const fetchedBuyNowOrders = buynowSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update state with BuyNow orders
        setBuyNowOrders(fetchedBuyNowOrders);
      } catch (error) {
        console.error("Error fetching BuyNow orders:", error.message);
      }
    };

    fetchOrders();
  }, [userEmail]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5; // Number of rows per page

  // Calculate the index of the first and last rows
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentOrders = orders.slice(indexOfFirstRow, indexOfLastRow);

  // Handle page change
  const handleNextPage = () => {
    if (currentPage < Math.ceil(orders.length / rowsPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const [currentPages, setCurrentPages] = useState(1); // Current page
  const rowsPerPages = 5; // Number of rows per page
  
  const handlePreviousPages = () => {
    setCurrentPages((prevPage) => Math.max(prevPage - 1, 1));
  };
  
  const handleNextPages = () => {
    setCurrentPages((prevPage) =>
      Math.min(prevPage + 1, Math.ceil(orders.length / rowsPerPages))
    );
  };

//   // Calculate the total number of orders by counting `id`s in both arrays
// const totalOrders = currentOrders.filter(order => order.id).length + buyNowOrders.filter(order => order.id).length;


const [totalOrders, setTotalOrders] = useState(0); // Initialize totalOrders state

useEffect(() => {
  const fetchTotalOrders = async () => {
    try {
      // Reference to the user's 'buynow order' collection
      const userDocRef = doc(db,  userEmail);
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
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
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
          <p className="text-3xl font-bold">₹{totalRevenue}</p>
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

      {/* One-Column Layout */}
      <div className="grid grid-cols-[30%,70%] lg:grid-cols-[30%,70%] gap-8">
      {/* Order Form Column */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            {editOrderId ? "Edit Cart Order" : "Edit Cart Order"}
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Order ID"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.id}
              onChange={(e) =>
                setNewOrder({ ...newOrder, id: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="items"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.totalItems}
              onChange={(e) =>
                setNewOrder({ ...newOrder, totalItems: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Payment Method"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.paymentMethod}
              onChange={(e) =>
                setNewOrder({ ...newOrder, paymentMethod: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Final Total"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.finalTotal}
              onChange={(e) =>
                setNewOrder({ ...newOrder, finalTotal: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrder.orderDate}
              onChange={(e) =>
                setNewOrder({ ...newOrder, orderDate: e.target.value })
              }
            />
          </div>
          <div className="mt-4 flex justify-between">
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
              onClick={editOrderId ? handleUpdateOrder : handleAddOrder}
            >
              {editOrderId ? "Update Order" : "Update Order"}
            </button>
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
              onClick={resetForm}
            >
              Clear Form
            </button>
          </div>
        </div>
        

        {/* Cart Orders Section  */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-2xl font-semibold text-blue-500 mb-4">
        Cart Order List
      </h2>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-blue-100 text-blue-700">
            <th className="border p-3 text-left">Order ID</th>
            <th className="border p-3 text-left">Items</th>
            <th className="border p-3 text-left">Payment Method</th>
            <th className="border p-3 text-left">Final Total</th>
            <th className="border p-3 text-left">Order Date</th>
            <th className="border p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((order) => (
            <tr key={order.id} className="text-gray-800 dark:text-white">
              <td className="border p-3">{order.id}</td>
              <td className="border p-3">{order.totalItems}</td>
              <td className="border p-3">{order.paymentMethod}</td>
              <td className="border p-3">₹{order.finalTotal}</td>
              <td className="border p-3">{order.orderDate}</td>
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
          ))}
        </tbody>
      </table>
      {/* Pagination Buttons */}
      <div className="flex justify-between items-center mt-4">
        <button
          className={`px-4 py-2 bg-blue-500 text-white rounded ${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {Math.ceil(orders.length / rowsPerPage)}
        </span>
        <button
          className={`px-4 py-2 bg-blue-500 text-white rounded ${
            currentPage === Math.ceil(orders.length / rowsPerPage)
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={handleNextPage}
          disabled={currentPage === Math.ceil(orders.length / rowsPerPage)}
        >
          Next
        </button>
      </div>
    </div>
  </div>


{/* Two-Column Layout */}
<div className="grid grid-cols-[30%,70%] lg:grid-cols-[30%,70%] gap-8 mt-5">
{/* Order Form Column */}
<div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            {editOrderIds ? "Edit Buynow Order" : "Edit Buynow Order"}
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Order ID"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrders.id}
              onChange={(e) =>
                setNewOrders({ ...newOrders, id: e.target.value })
              }
            />
            {/* <input
              type="text"
              placeholder="items"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrders.totalItems}
              onChange={(e) =>
                setNewOrders({ ...newOrders, totalItems: e.target.value })
              }
            /> */}
            <input
              type="text"
              placeholder="Payment Method"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrders.paymentmethod}
              onChange={(e) =>
                setNewOrders({ ...newOrders, paymentmethod: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Final Total"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrders.totalamount}
              onChange={(e) =>
                setNewOrders({ ...newOrders, totalamount: e.target.value })
              }
            />
            <input
              type="date"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newOrders.orderdate}
              onChange={(e) =>
                setNewOrders({ ...newOrders, orderDate: e.target.value })
              }
            />
          </div>
          <div className="mt-4 flex justify-between">
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
              onClick={editOrderIds ? handleUpdateOrders : handleAddOrder}
            >
              {editOrderIds ? "Update Order" : "Update Order"}
            </button>
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
              onClick={resetForms}
            >
              Clear Form
            </button>
          </div>
        </div>

        
{/* Cart Orders Section  */}
<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
<h2 className="text-2xl font-semibold text-blue-500 mb-4">
        BuyNow Orders
      </h2>
      {buyNowOrders.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-xl text-gray-500 dark:text-gray-400">
            No BuyNow Orders found.
          </p>
        </div>
      ) : (
        <table className="table-auto w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-blue-100 text-blue-700">
              <th className="border p-3 text-left ">Order ID</th>
              <th className="border p-3 text-left ">Payment Method</th>
              <th className="border p-3 text-left ">Total Amount</th>
              <th className="border p-3 text-left ">Order Date</th>
              <th className="border p-3 text-left ">Actions</th>
            </tr>
          </thead>
          <tbody>
            {buyNowOrders.map((order) => (
              <tr key={order.id} className="text-gray-800 dark:text-white">
                <td className="border p-3">{order.id}</td>
                <td className="border p-3">{order.paymentmethod || "N/A"}</td>
                <td className="border p-3">
                  ₹{order.totalamount || "N/A"}
                </td>
                <td className="border p-3">{order.orderdate || "N/A"}</td>
                <td className="border p-3 flex justify-around">
                <FontAwesomeIcon
                  icon={faEdit}
                  className="text-yellow-500 cursor-pointer"
                  onClick={() => {
                    setEditOrderIds(order.id);
                    setNewOrders(order);
                  }}
                />
                <FontAwesomeIcon
                  icon={faTrash}
                  className="text-red-500 cursor-pointer"
                  onClick={() => handleDeleteOrder(order.id)}
                />
              </td>
              </tr>
            ))}
          </tbody>
        </table>
              )}

      {/* Pagination Buttons */}
      <div className="flex justify-between items-center mt-4">
        <button
          className={`px-4 py-2 bg-blue-500 text-white rounded ${
            currentPages === 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handlePreviousPages}
          disabled={currentPages === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPages} of {Math.ceil(orders.length / rowsPerPages)}
        </span>
        <button
          className={`px-4 py-2 bg-blue-500 text-white rounded ${
            currentPages === Math.ceil(orders.length / rowsPerPages)
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={handleNextPages}
          disabled={currentPages === Math.ceil(orders.length / rowsPerPages)}
        >
          Next
        </button>
      </div>
    </div>
  </div>

</div>
  );
};

export default ManageOrders;
