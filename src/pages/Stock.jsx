import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { FaChartLine } from "react-icons/fa";
import { auth, db } from "../config/firebase";

const Stocks = () => {
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newStock, setNewStock] = useState({
    no: "",
    pname: "",
    categories: "",
    estock: "",
    cstock: "",
    price: "",
  });
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const productsRef = collection(userDocRef, "Stocks");
        const productSnapshot = await getDocs(productsRef);

        const productList = productSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [user]);

  const getNextProductNo = () => {
    if (products.length === 0) return 101;
    const maxNo = Math.max(...products.map((prod) => parseInt(prod.no, 10)));
    return maxNo + 1;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStock((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please log in to add or update a product.");
      return;
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productsRef = collection(userDocRef, "Stocks");

      // Auto-generate Product No if not set
      if (!newStock.no) {
        newStock.no = getNextProductNo().toString();
      }

      // Add or update the product
      await setDoc(doc(productsRef, newStock.no), newStock, { merge: true });

      alert(newStock.no ? "Product added successfully!" : "Product updated successfully!");

      const updatedProducts = products.filter((prod) => prod.no !== newStock.no);
      setProducts([...updatedProducts, newStock]);

      setShowModal(false);
      setNewStock({ no: "", pname: "", categories: "", estock: "", cstock: "", price: "" });
    } catch (error) {
      console.error("Error adding/updating product:", error);
      alert("Failed to add or update the product.");
    }
  };

  const handleRemoveProduct = async (no) => {
    if (!user) {
      alert("Please log in to delete a product.");
      return;
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = doc(userDocRef, "Stocks", no);

      // Delete product from Firestore
      await deleteDoc(productRef);

      // Update the UI by removing the deleted product
      setProducts(products.filter((product) => product.no !== no));
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete the product.");
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.pname &&
      product.pname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Purchase Info: Product, Supplier, and Price
  const totalProducts = filteredProducts.length;
  const totalSuppliers = new Set(
    filteredProducts.map((product) => product.sname)
  ).size; // Unique suppliers
  const totalPurchasePrice = filteredProducts
    .reduce(
      (total, product) =>
        total + parseFloat(product.price) * parseInt(product.qnt),
      0
    )
    .toFixed(2);

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-purple-50 via-pink-100 to-yellow-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6 flex items-center">
        Stock Management{" "}
        <FaChartLine className="text-5xl ml-5 text-pink-700 animate-neon" />
      </h1>

      <button
        onClick={() => {
          setShowModal(true);
          setNewStock({ no: "", pname: "", categories: "", estock: "", cstock: "", price: "" });
        }}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600"
      >
        Add Stock
      </button>

      <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300 w-80">
        <h3 className="text-xl font-semibold text-indigo-600">Total Products</h3>
        <p className="text-4xl font-bold text-yellow-500">{totalProducts}</p>
      </div>

      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white ">
            <tr>
              <th className="py-3 px-4 text-left">Product No.</th>
              <th className="py-3 px-4 text-left">Product Name</th>
              <th className="py-3 px-4 text-left">Categories</th>
              <th className="py-3 px-4 text-left">Existing Stock</th>
              <th className="py-3 px-4 text-left">Current Stock</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((stock) => (
              <tr key={stock.no} className="hover:bg-yellow-100 text-sm sm:text-base">
                <td className="py-3 px-4 sm:px-4">{stock.no}</td>
                <td className="py-3 px-4 sm:px-4">{stock.pname}</td>
                <td className="py-3 px-4 sm:px-4">{stock.categories}</td>
                <td className="py-3 px-4 sm:px-4">{stock.estock}</td>
                <td className="py-3 px-4 sm:px-4">{stock.cstock}</td>
                <td className="py-3 px-4 sm:px-4 flex">
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setNewStock(stock);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <AiOutlineEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleRemoveProduct(stock.no)}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    <AiOutlineDelete size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl mb-4">{newStock.no ? "Update Stock" : "Add Stock"}</h2>
            <form onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="pname"
                value={newStock.pname}
                onChange={handleInputChange}
                placeholder="Product Name"
                className="w-full px-4 py-2 mb-4 border rounded"
                required
              />
              <input
                type="text"
                name="categories"
                value={newStock.categories}
                onChange={handleInputChange}
                placeholder="Categories"
                className="w-full px-4 py-2 mb-4 border rounded"
                required
              />
              <input
                type="number"
                name="estock"
                value={newStock.estock}
                onChange={handleInputChange}
                placeholder="Existing Stock"
                className="w-full px-4 py-2 mb-4 border rounded"
                required
              />
              <input
                type="number"
                name="cstock"
                value={newStock.cstock}
                onChange={handleInputChange}
                placeholder="Current Stock"
                className="w-full px-4 py-2 mb-4 border rounded"
                required
              />
              <input
                type="number"
                name="price"
                value={newStock.price}
                onChange={handleInputChange}
                placeholder="Price"
                className="w-full px-4 py-2 mb-4 border rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded mt-4 hover:bg-blue-600"
              >
                {newStock.no ? "Update Product" : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks;
