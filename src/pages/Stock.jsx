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
        const productsRef = collection(userDocRef, "Purchase");
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

  // Filter logic
  const filteredProducts = products.filter((product) => {
    const { pname, categories, estock, cstock, price } = product;
    const query = searchQuery.toLowerCase();

    return (
      (pname && pname.toLowerCase().includes(query)) ||
      (categories && categories.toLowerCase().includes(query)) ||
      (estock && estock.toString().toLowerCase().includes(query)) ||
      (cstock && cstock.toString().toLowerCase().includes(query)) ||
      (price && price.toString().toLowerCase().includes(query))
    );
  });

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
  const [filteredInvoiceData, setFilteredInvoiceData] = useState([]);

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
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
      <div className="bg-blue-900 p-4 rounded-md shadow-md mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">Filters</h2>
        <div className="flex flex-wrap gap-4">
          <input
            className="px-3 py-2 rounded-md"
            type="text"
            placeholder="Search by Product Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-md"
            type="text"
            name="pname"
            placeholder="Filter by Product Name"
            value={filters.pname}
            onChange={handleFilterChange}
          />
          <input
            className="px-3 py-2 rounded-md"
            type="text"
            name="categories"
            placeholder="Filter by Categories"
            value={filters.categories}
            onChange={handleFilterChange}
          />
          <input
            className="px-3 py-2 rounded-md"
            type="text"
            name="estock"
            placeholder="Filter by Estock"
            value={filters.estock}
            onChange={handleFilterChange}
          />
          <input
            className="px-3 py-2 rounded-md"
            type="text"
            name="cstock"
            placeholder="Filter by Cstock"
            value={filters.cstock}
            onChange={handleFilterChange}
          />
          <input
            className="px-3 py-2 rounded-md"
            type="text"
            name="price"
            placeholder="Filter by Price"
            value={filters.price}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Product List */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="py-3 px-4 text-left ">P.No</th>
              <th className="py-3 px-4 text-left">Product Name</th>
              {/* <th className="py-3 px-4">Categories</th> */}
              <th className="py-3 px-4 text-left">Existing stock</th>
              <th className="py-3 px-4 text-left">Curreny stock</th>
              <th className="py-3 px-4 text-left">Price</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              // Filter sales data related to this product
              const productSales = filteredInvoiceData
                .map((invoice) =>
                  (invoice.products || []).filter(
                    (productInInvoice) =>
                      productInInvoice.description === product.pname
                  )
                )
                .flat();

              // Calculate total quantity sold for the product
              const totalSold = productSales.reduce(
                (acc, productInInvoice) =>
                  acc + (productInInvoice.quantity || 0),
                0
              );

              // Calculate current stock: Existing stock - Total sold
              const currentStock = product.estock - totalSold;

              return (
                <tr key={product.no} className="border-b">
                  <td className="py-3 px-4">{product.no}</td>
                  <td className="py-3 px-4">{product.pname}</td>
                  <td className="py-3 px-4">{product.estock}</td>
                  <td className="py-3 px-4">{currentStock}</td>
                  <td className="py-3 px-4">${product.price}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setShowModal(true);
                        setNewStock(product);
                      }}
                      className="text-yellow-600 mr-2"
                    >
                      <AiOutlineEdit size={24} />
                    </button>
                    <button
                      onClick={() => handleRemoveProduct(product.no)}
                      className="text-red-600"
                    >
                      <AiOutlineDelete size={24} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-2xl font-semibold mb-4">Add/Update Product</h2>
            <form onSubmit={handleFormSubmit}>
              {/* Product No */}
              <input
                className="w-full px-3 py-2 mb-4 rounded-md border"
                type="text"
                name="no"
                placeholder="Product No"
                value={newStock.no}
                disabled
              />
              {/* Product Name */}
              <input
                className="w-full px-3 py-2 mb-4 rounded-md border"
                type="text"
                name="pname"
                placeholder="Product Name"
                value={newStock.pname}
                onChange={handleInputChange}
              />
              {/* Categories */}
              <input
                className="w-full px-3 py-2 mb-4 rounded-md border"
                type="text"
                name="categories"
                placeholder="Categories"
                value={newStock.categories}
                onChange={handleInputChange}
              />
              {/* Estock */}
              <input
                className="w-full px-3 py-2 mb-4 rounded-md border"
                type="number"
                name="estock"
                placeholder="Estock"
                value={newStock.estock}
                onChange={handleInputChange}
              />
              {/* Cstock */}
              <input
                className="w-full px-3 py-2 mb-4 rounded-md border"
                type="number"
                name="cstock"
                placeholder="Cstock"
                value={newStock.cstock}
                onChange={handleInputChange}
              />
              {/* Price */}
              <input
                className="w-full px-3 py-2 mb-4 rounded-md border"
                type="number"
                name="price"
                placeholder="Price"
                value={newStock.price}
                onChange={handleInputChange}
              />
              {/* Submit Button */}
              <div className="flex justify-between items-center">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  {newStock.no ? "Update Product" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-600 ml-4"
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
