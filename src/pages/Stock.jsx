import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { FaChartLine } from "react-icons/fa";
import { auth, db } from "../config/firebase";
import Swal from "sweetalert2";

const Stocks = () => {
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    pname: "",
    categories: "",
    estock: "",
    cstock: "",
    price: "",
  });

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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

      alert(
        newStock.no
          ? "Product added successfully!"
          : "Product updated successfully!"
      );

      const updatedProducts = products.filter(
        (prod) => prod.no !== newStock.no
      );
      setProducts([...updatedProducts, newStock]);

      setShowModal(false);
      setNewStock({
        no: "",
        pname: "",
        categories: "",
        estock: "",
        cstock: "",
        price: "",
      });
    } catch (error) {
      console.error("Error adding/updating product:", error);
      alert("Failed to add or update the product.");
    }
  };

  const handleRemoveProduct = async (no) => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Not Logged In",
        text: "Please log in to delete a product.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = doc(userDocRef, "Stocks", no);

      // Confirm deletion with SweetAlert
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won’t be able to undo this action!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
      });

      if (result.isConfirmed) {
        // Delete product from Firestore
        await deleteDoc(productRef);

        // Update the UI by removing the deleted product
        setProducts(products.filter((product) => product.no !== no));

        // Success SweetAlert
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Product has been deleted successfully.",
          confirmButtonText: "Okay",
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);

      // Error SweetAlert
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete the product. Please try again later.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#d33",
      });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.pname &&
      product.pname.toLowerCase().includes(filters.pname.toLowerCase()) &&
      product.categories
        .toLowerCase()
        .includes(filters.categories.toLowerCase()) &&
      product.estock.toLowerCase().includes(filters.estock.toLowerCase()) &&
      product.cstock.toLowerCase().includes(filters.cstock.toLowerCase()) &&
      product.price.toLowerCase().includes(filters.price.toLowerCase())
  );

  // Info Box Calculations
  const totalProducts = filteredProducts.length;
  const totalStock = filteredProducts.reduce(
    (acc, product) => acc + parseInt(product.estock),
    0
  );
  const totalPrice = filteredProducts
    .reduce(
      (acc, product) =>
        acc + parseFloat(product.price) * parseInt(product.estock),
      0
    )
    .toFixed(2);

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-6 flex items-center">
        Stock Management{" "}
        <FaChartLine className="text-5xl ml-5 text-blue-900 animate-neon" />
      </h1>
      {/* Info Boxes */}
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-green-900 p-4 rounded-md shadow-md border-l-4 border-green-400">
          <h3 className="text-lg font-semibold text-gray-100">
            Total Products
          </h3>
          <p className="text-3xl font-bold text-gray-100">{totalProducts}</p>
        </div>
        <div className="bg-red-900 p-4 rounded-md shadow-md border-l-4 border-red-400">
          <h3 className="text-lg font-semibold text-gray-100">Total Stock</h3>
          <p className="text-3xl font-bold text-gray-100">{totalStock}</p>
        </div>
        <div className="bg-blue-900 p-4 rounded-md shadow-md border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-gray-100">Total Price</h3>
          <p className="text-3xl font-bold text-gray-100">${totalPrice}</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-blue-700 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-5 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="pname"
              className="text-white block mb-1 font-semibold"
            >
              Product Name
            </label>
            <input
              type="text"
              id="pname"
              name="pname"
              value={filters.pname}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Product Name"
            />
          </div>
          <div>
            <label
              htmlFor="categories"
              className="text-white block mb-1 font-semibold"
            >
              Categories
            </label>
            <input
              type="text"
              id="categories"
              name="categories"
              value={filters.categories}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Categories"
            />
          </div>
          <div>
            <label
              htmlFor="estock"
              className="text-white block mb-1 font-semibold"
            >
              Existing Stock
            </label>
            <input
              type="text"
              id="estock"
              name="estock"
              value={filters.estock}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Existing Stock"
            />
          </div>
          <div>
            <label
              htmlFor="cstock"
              className="text-white block mb-1 font-semibold"
            >
              Current Stock
            </label>
            <input
              type="text"
              id="cstock"
              name="cstock"
              value={filters.cstock}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Current Stock"
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="text-white block mb-1 font-semibold"
            >
              Price
            </label>
            <input
              type="text"
              id="price"
              name="price"
              value={filters.price}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Price"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setShowModal(true);
          setNewStock({
            no: "",
            pname: "",
            categories: "",
            estock: "",
            cstock: "",
            price: "",
          });
        }}
        className="bg-blue-900 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600"
      >
        Add Stock
      </button>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 shadow-md">
          <thead className="bg-gradient-to-r from-blue-700 to-blue-700 text-white">
            <tr>
              <th className="py-3 px-6 text-left text-sm sm:text-base font-semibold">
                Product No.
              </th>
              <th className="py-3 px-4 text-left text-sm sm:text-base font-semibold">
                Product Name
              </th>
              <th className="py-3 px-4 text-left text-sm sm:text-base font-semibold">
                Categories
              </th>
              <th className="py-3 px-4 text-left text-sm sm:text-base font-semibold">
                Existing Stock
              </th>
              <th className="py-3 px-4 text-left text-sm sm:text-base font-semibold">
                Current Stock
              </th>
              <th className="py-3 px-4 text-left text-sm sm:text-base font-semibold">
                Price
              </th>
              <th className="py-3 px-4 text-left text-sm sm:text-base font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((stock) => (
              <tr
                key={stock.no}
                className="hover:bg-yellow-100 text-sm sm:text-base"
              >
                <td className="py-3 px-4 sm:px-4">{stock.no}</td>
                <td className="py-3 px-4 sm:px-4">{stock.pname}</td>
                <td className="py-3 px-4 sm:px-4">{stock.categories}</td>
                <td className="py-3 px-4 sm:px-4">{stock.estock}</td>
                <td className="py-3 px-4 sm:px-4">{stock.cstock}</td>
                <td className="py-3 px-4 sm:px-4">{stock.price}</td>
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

      {/* Modal for Add/Edit Product */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl mb-4">
              {newStock.no ? "Update Stock" : "Add Stock"}
            </h2>
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
