import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { auth, db } from "../config/firebase"; // Ensure firebase is correctly initialized

// The Stock and Sales Management Component
const StocksAndSales = () => {
  const [showModal, setShowModal] = useState(false); // For modal visibility
  const [newStock, setNewStock] = useState({
    pname: "",
    categories: "",
    stock: 0,
    Sales : "",
    price: "",
  });
  const [newSale, setNewSale] = useState({
    pname: "",
    quantity: 0,
    price: "",
    total: 0,
    date: new Date().toISOString(),
  });

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // For searching/filtering products
  const [user] = useAuthState(auth); // To get the current authenticated user

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return; // Ensure user is authenticated

      try {
        const userDocRef = doc(db, "admins", user.email);

        // Fetch products
        const productsRef = collection(userDocRef, "Stocks");
        const productSnapshot = await getDocs(productsRef);
        const productList = productSnapshot.docs.map((doc) => doc.data());
        setProducts(productList);

        // Fetch sales history
        const salesRef = collection(userDocRef, "Sales");
        const salesSnapshot = await getDocs(salesRef);
        const salesList = salesSnapshot.docs.map((doc) => doc.data());
        setSales(salesList);

      } catch (error) {
        console.error("Error fetching data: ", error);
        alert("Failed to load data.");
      }
    };

    fetchData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStock((prev) => ({ ...prev, [name]: value }));
  };

  // Add New Stock
  const handleAddStocks = async (e) => {
    e.preventDefault();

    const { pname, categories, stock, price } = newStock;
    if (!pname || !categories || !stock || !price) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const stockRef = collection(userDocRef, "Stocks");
      await setDoc(doc(stockRef, pname), {
        ...newStock,
      });

      setProducts((prev) => [
        ...prev,
        {
          ...newStock,
        },
      ]);
      alert("Stocks added successfully!");
      setNewStock({
        pname: "",
        categories: "",
        stock: 0,
        price: "",
      });
      setShowModal(false); // Close modal after adding stock
    } catch (error) {
      console.error("Error adding stock: ", error);
    }
  };

  // Update Stock
  const handleUpdateStock = async (e) => {
    e.preventDefault();

    const { pname, categories, stock, price } = newStock;
    if (!pname || !categories || !stock || !price) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const stockRef = collection(userDocRef, "Stocks");
      await setDoc(doc(stockRef, pname), {
        ...newStock,
      });

      setProducts((prev) =>
        prev.map((product) =>
          product.pname === newStock.pname ? { ...newStock } : product
        )
      );
      alert("Stocks updated successfully!");
      setShowModal(false); // Close modal after updating stock
    } catch (error) {
      console.error("Error updating stocks: ", error);
    }
  };

  // Remove Stock
  const handleRemoveStock = async (pname) => {
    try {
      const userDocRef = doc(db, "admins", user.email);
      const stockRef = collection(userDocRef, "Stocks");
      await deleteDoc(doc(stockRef, pname));

      setProducts((prev) => prev.filter((product) => product.pname !== pname));
      alert("Stocks removed successfully!");
    } catch (error) {
      console.error("Error removing stocks: ", error);
    }
  };

  // Handle Sale Add
  const handleAddSale = async (e) => {
    e.preventDefault();

    const { pname, quantity, price } = newSale;
    if (!pname || !quantity || !price) {
      return alert("Please fill all the fields.");
    }

    try {
      const total = parseFloat(price) * parseInt(quantity);
      setNewSale((prev) => ({
        ...prev,
        total,
      }));

      const userDocRef = doc(db, "admins", user.email);
      const salesRef = collection(userDocRef, "Sales");
      await setDoc(doc(salesRef, `${pname}-${new Date().getTime()}`), {
        ...newSale,
        total,
      });

      setSales((prev) => [
        ...prev,
        {
          ...newSale,
          total,
        },
      ]);
      alert("Sale recorded successfully!");
      setNewSale({
        pname: "",
        quantity: 0,
        price: "",
        total: 0,
        date: new Date().toISOString(),
      });
      setShowModal(false); // Close modal after sale is added
    } catch (error) {
      console.error("Error adding sale: ", error);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.pname &&
      product.pname.toLowerCase().includes(searchQuery.toLowerCase())
  );
  

  // Stock Info: Product, Categories, and Total Stock Value
  const totalProducts = filteredProducts.length;
  const totalCategories = new Set(
    filteredProducts.map((product) => product.categories)
  ).size; // Unique categories
  const totalStockValue = filteredProducts
    .reduce(
      (total, product) =>
        total + parseFloat(product.price) * parseInt(product.stock),
      0
    )
    .toFixed(2);

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-purple-50 via-pink-100 to-yellow-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6">
        Stock and Sales Management
      </h1>

      {/* Add Stock Button */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 transition duration-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Stock
      </button>

      {/* Add Sale Button */}
      {/* <button
        onClick={() => setShowModal(true)}
        className="bg-green-500 text-white py-2 px-4 rounded-lg mb-4 transition duration-300 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Record Sale
      </button> */}

      {/* Info Box - Split into Product, Category, and Stock Value Sections */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-6 mb-6">
        {/* Product Info */}
        <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300">
          <h3 className="text-xl font-semibold text-indigo-600">
            Total Products
          </h3>
          <p className="text-4xl font-bold text-yellow-500">{totalProducts}</p>
        </div>

        {/* Category Info */}
        <div className="bg-green-100 p-6 rounded-lg shadow-lg text-center border-2 border-green-300">
          <h3 className="text-xl font-semibold text-green-600">
            Total Categories
          </h3>
          <p className="text-4xl font-bold text-yellow-500">
            {totalCategories}
          </p>
        </div>

        {/* Stock Value Info */}
        <div className="bg-pink-100 p-6 rounded-lg shadow-lg text-center border-2 border-pink-300">
          <h3 className="text-xl font-semibold text-pink-600">
            Total Stock Value
          </h3>
          <p className="text-4xl font-bold text-yellow-500">
            ${totalStockValue}
          </p>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 shadow-md">
          <thead className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Stock</th>
              <th className="py-3 px-4 text-left">Price</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.pname}>
                <td className="py-3 px-4">{product.pname}</td>
                <td className="py-3 px-4">{product.categories}</td>
                <td className="py-3 px-4">{product.stock}</td>
                <td className="py-3 px-4">${product.price}</td>
                <td className="py-3 px-4">
                  <AiOutlineEdit
                    className="text-yellow-600 cursor-pointer"
                    onClick={() => setShowModal(true)}
                  />
                  <AiOutlineDelete
                    className="ml-4 text-red-600 cursor-pointer"
                    onClick={() => handleRemoveStock(product.pname)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding/Editing Stock or Sale */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold mb-4">
              {newStock.pname ? "Edit Stock" : "Add New Stock"}
            </h2>
            <form
              onSubmit={newStock.pname ? handleUpdateStock : handleAddStocks}
              className="space-y-4"
            >
              <input
                type="text"
                name="pname"
                value={newStock.pname}
                onChange={handleInputChange}
                className="w-full border-2 p-2 rounded-md"
                placeholder="Product Name"
              />
              <input
                type="text"
                name="categories"
                value={newStock.categories}
                onChange={handleInputChange}
                className="w-full border-2 p-2 rounded-md"
                placeholder="Categories"
              />
              <input
                type="number"
                name="stock"
                value={newStock.stock}
                onChange={handleInputChange}
                className="w-full border-2 p-2 rounded-md"
                placeholder="Stock Quantity"
              />
              <input
                type="number"
                name="price"
                value={newStock.price}
                onChange={handleInputChange}
                className="w-full border-2 p-2 rounded-md"
                placeholder="Price"
              />

              <div className="flex justify-between mt-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  {newStock.pname ? "Update" : "Add Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksAndSales;
