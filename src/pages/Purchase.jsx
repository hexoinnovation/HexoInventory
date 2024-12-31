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
import { auth, db } from "../config/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

const Purchase = () => {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false); // To differentiate between Add and Edit
  const [newProduct, setNewProduct] = useState({
    no: "",
    sname: "",
    phone: "",
    add: "",
    pname: "",
    categories: "",
    estock: "",
    price: "",
    sales: 0,
    stock: 0,
  });

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    no: "",
    sname: "",
    phone: "",
    add: "",
    pname: "",
    categories: "",
  });

  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const productsRef = collection(userDocRef, "Purchase");
        const productSnapshot = await getDocs(productsRef);
        const productList = productSnapshot.docs.map((doc) => doc.data());
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };

    fetchProducts();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productsRef = collection(userDocRef, "Purchase");

      await setDoc(doc(productsRef, newProduct.phone), newProduct);

      setProducts((prev) => [...prev, newProduct]);
      Swal.fire("Success", "Product added successfully!", "success");
      setShowModal(false);
      setNewProduct({
        no: "",
        sname: "",
        phone: "",
        add: "",
        pname: "",
        categories: "",
        estock: "",
        price: "",
        sales: 0,
        stock: 0,
      });
    } catch (error) {
      console.error("Error adding product: ", error);
      Swal.fire("Error", "Failed to add product.", "error");
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productsRef = collection(userDocRef, "Purchase");

      await setDoc(doc(productsRef, newProduct.phone), newProduct);

      setProducts((prev) =>
        prev.map((product) =>
          product.phone === newProduct.phone ? newProduct : product
        )
      );
      Swal.fire("Success", "Product updated successfully!", "success");
      setShowModal(false);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating product: ", error);
      Swal.fire("Error", "Failed to update product.", "error");
    }
  };

  const handleRemoveProduct = async (phone) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productsRef = collection(userDocRef, "Purchase");

      await deleteDoc(doc(productsRef, phone));

      setProducts((prev) => prev.filter((product) => product.phone !== phone));
      Swal.fire("Success", "Product deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting product: ", error);
      Swal.fire("Error", "Failed to delete product.", "error");
    }
  };

  const filteredProducts = products.filter((product) =>
    Object.keys(filters).every((key) => {
      if (!filters[key]) return true;
      return product[key]
        ?.toString()
        .toLowerCase()
        .includes(filters[key].toLowerCase());
    })
  );

  const totalProducts = products.length;
  const totalSuppliers = new Set(products.map((product) => product.sname)).size;
  const totalStockValue = products.reduce(
    (acc, product) =>
      acc + parseFloat(product.price || 0) * parseInt(product.estock || 0),
    0
  );

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Info Boxes */}
      <h1 className="text-5xl font-extrabold text-blue-900 mb-6">
        Purchase Orders
        <FontAwesomeIcon
          icon={faStore}
          className="text-5xl ml-5 text-blue-900 animate-bounce"
        />
      </h1>
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-900 p-4 rounded-md shadow-md border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-gray-100">
            Total Products
          </h3>
          <p className="text-3xl font-bold text-gray-100">{totalProducts}</p>
        </div>
        <div className="bg-green-900 p-4 rounded-md shadow-md border-l-4 border-green-400">
          <h3 className="text-lg font-semibold text-gray-100">
            Total Suppliers
          </h3>
          <p className="text-3xl font-bold text-gray-100">{totalSuppliers}</p>
        </div>
        <div className="bg-red-900 p-4 rounded-md shadow-md border-l-4 border-red-400">
          <h3 className="text-lg font-semibold text-gray-100">
            Total Stock Value
          </h3>
          <p className="text-3xl font-bold text-gray-100">
          ₹{totalStockValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-blue-900 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-6 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="no" className="text-white block mb-1 font-semibold">
              Product Number
            </label>
            <input
              type="text"
              id="no"
              name="no"
              value={filters.no}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Product Number"
            />
          </div>
          <div>
            <label
              htmlFor="sname"
              className="text-white block mb-1 font-semibold"
            >
              Supplier Name
            </label>
            <input
              type="text"
              id="sname"
              name="sname"
              value={filters.sname}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Supplier Name"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="text-white block mb-1 font-semibold"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={filters.phone}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Phone Number"
            />
          </div>
          <div>
            <label
              htmlFor="add"
              className="text-white block mb-1 font-semibold"
            >
              Address
            </label>
            <input
              type="text"
              id="add"
              name="add"
              value={filters.add}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Address"
            />
          </div>
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
        </div>
      </div>

      <button
        onClick={() => {
          setShowModal(true);
          setEditMode(false);
          setNewProduct({
            no: "",
            sname: "",
            phone: "",
            add: "",
            pname: "",
            categories: "",
            estock: "",
            price: "",
            sales: 0,
            stock: 0,
          });
        }}
        className="bg-blue-900 text-white py-2 px-4 rounded-lg mb-4 transition duration-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Product
      </button>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 shadow-md">
          <thead className="bg-gradient-to-r from-blue-900 to-blue-900 text-white">
            <tr>
              <th className="py-3 px-4 text-left">P.No</th>
              <th className="py-3 px-4 text-left">Supplier</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Address</th>
              {/* <th className="py-3 px-4">Categories</th> */}
              <th className="py-3 px-4 text-left">Product Name</th>
              <th className="py-3 px-4 text-left">Existing Stock</th>
              <th className="py-3 px-4 text-left">Unit Price</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr
                key={product.phone}
                className="hover:bg-yellow-100 transition duration-300"
              >
                <td className="py-3 px-4">{product.no}</td>
                <td className="py-3 px-4">{product.sname}</td>
                <td className="py-3 px-4">{product.phone}</td>
                <td className="py-3 px-4">{product.add}</td>
                {/* <td className="py-3 px-4">{product.categories}</td> */}
                <td className="py-3 px-4">{product.pname}</td>
                <td className="py-3 px-4 text-left">{product.estock}</td>
                <td className="py-3 px-4">₹{product.price}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => {
                      setShowModal(true);
                      setEditMode(true);
                      setNewProduct(product);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <AiOutlineEdit />
                  </button>
                  <button
                    onClick={() => handleRemoveProduct(product.phone)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    <AiOutlineDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-2xl font-semibold mb-4 text-purple-700">
              {editMode ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={editMode ? handleUpdateProduct : handleAddProduct}>
              <input
                type="text"
                name="no"
                value={newProduct.no}
                onChange={handleInputChange}
                placeholder="Product No."
                className="w-full mb-4 p-2 border rounded"
                required
              />
              <input
                type="text"
                name="sname"
                value={newProduct.sname}
                onChange={handleInputChange}
                placeholder="Supplier Name"
                className="w-full mb-4 p-2 border rounded"
                required
              />
              <input
                type="text"
                name="phone"
                value={newProduct.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="w-full mb-4 p-2 border rounded"
                required
              />
              <input
                type="text"
                name="add"
                value={newProduct.add}
                onChange={handleInputChange}
                placeholder="Address"
                className="w-full mb-4 p-2 border rounded"
                required
              />
              <input
                type="text"
                name="pname"
                value={newProduct.pname}
                onChange={handleInputChange}
                placeholder="Product Name"
                className="w-full mb-4 p-2 border rounded"
                required
              />
              {/* <input
                type="text"
                name="categories"
                value={newProduct.categories}
                onChange={handleInputChange}
                placeholder="Categories"
                className="w-full mb-4 p-2 border rounded"
                required
              /> */}
              <input
                type="number"
                name="estock"
                value={newProduct.estock}
                onChange={handleInputChange}
                placeholder="Existing Stock"
                className="w-full mb-4 p-2 border rounded"
                required
              />
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                placeholder="Price"
                className="w-full mb-4 p-2 border rounded"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
              >
                {editMode ? "Update Product" : "Add Product"}
              </button>
            </form>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full text-red-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;
