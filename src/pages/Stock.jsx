import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { auth, db } from "../config/firebase";

const Stocks = () => {
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newStock, setNewStock] = useState({
    no: "",
    pname: "",
    categories: "",
    stock: "",
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

      if (!newStock.no) {
        newStock.no = getNextProductNo().toString();
      }

      await setDoc(doc(productsRef, newStock.no), newStock, { merge: true });

      alert(newStock.no ? "Product updated successfully!" : "Product added successfully!");

      const updatedProducts = products.filter((prod) => prod.no !== newStock.no);
      setProducts([...updatedProducts, newStock]);

      setShowModal(false);
      setNewStock({ no: "", pname: "", categories: "", stock: "", price: "" });
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

      await deleteDoc(productRef);

      setProducts(products.filter((product) => product.no !== no));
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete the product.");
    }
  };
 // Filter products based on search query
 const filteredProducts = products.filter((product) =>
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
      <h1 className="text-3xl font-extrabold text-pink-700 mb-6">Stock Management</h1>

      <button
        onClick={() => {
          setShowModal(true);
          setNewStock({ no: "", pname: "", categories: "", stock: "", price: "" });
        }}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600"
      >
        Add Stock
      </button>
      <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300 w-80">
          <h3 className="text-xl font-semibold text-indigo-600">Total Products</h3>
          <p className="text-4xl font-bold text-yellow-500">{totalProducts}</p>
        </div>
      <div className=" w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white">
            <tr>
              <th className="py-2 px-2 sm:px-4">Product No.</th>
              <th className="py-2 px-2 sm:px-4">Product</th>
              <th className="py-2 px-2 sm:px-4">Categories</th>
              <th className="py-2 px-2 sm:px-4">Stock</th>
              <th className="py-2 px-2 sm:px-4">Price</th>
              <th className="py-2 px-2 sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((stock) => (
              <tr key={stock.no} className="hover:bg-yellow-100 text-sm sm:text-base">
                <td className="py-2 px-2 sm:px-4">{stock.no}</td>
                <td className="py-2 px-2 sm:px-4">{stock.pname}</td>
                <td className="py-2 px-2 sm:px-4">{stock.categories}</td>
                <td className="py-2 px-2 sm:px-4">{stock.stock}</td>
                <td className="py-2 px-2 sm:px-4">${stock.price}</td>
                <td className="py-2 px-2 sm:px-4 flex">
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
                className="w-full p-2 border mb-3 rounded"
                required
              />
              <input
                type="text"
                name="categories"
                value={newStock.categories}
                onChange={handleInputChange}
                placeholder="Categories"
                className="w-full p-2 border mb-3 rounded"
                required
              />
              <input
                type="number"
                name="stock"
                value={newStock.stock}
                onChange={handleInputChange}
                placeholder="Stock Quantity"
                className="w-full p-2 border mb-3 rounded"
                required
              />
              <input
                type="number"
                name="price"
                value={newStock.price}
                onChange={handleInputChange}
                placeholder="Price"
                className="w-full p-2 border mb-3 rounded"
                required
              />
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  {newStock.no ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
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

export default Stocks;
