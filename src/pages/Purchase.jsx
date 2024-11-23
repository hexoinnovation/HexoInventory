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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore } from "@fortawesome/free-solid-svg-icons";

// The Purchase Component
const Purchase = () => {
  const [showModal, setShowModal] = useState(false); // For modal visibility
  const [newProduct, setNewProduct] = useState({
    sname: "",
    phone: "",
    add: "",
    pname: "",
    categories: "",
    qnt: "",
    price: "",
    sales: 0,
    stock: 0,
  });

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // For searching/filtering products
  const [user] = useAuthState(auth); // To get the current authenticated user

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

  // Add New Product
  const handleAddProduct = async (e) => {
    e.preventDefault();

    const { sname, pname, phone, add, categories, qnt, price } = newProduct;
    if (!sname || !pname || !phone || !add || !categories || !qnt || !price) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = collection(userDocRef, "Purchase");
      await setDoc(doc(productRef, phone), {
        ...newProduct,
      });

      setProducts((prev) => [
        ...prev,
        {
          ...newProduct,
        },
      ]);
      alert("Product added successfully!");
      setNewProduct({
        sname: "",
        phone: "",
        add: "",
        pname: "",
        categories: "",
        qnt: "",
        price: "",
        sales: 0,
        stock: 0,
      });
      setShowModal(false); // Close modal after adding product
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  // Update Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    const { sname, pname, phone, add, categories, qnt, price } = newProduct;
    if (!sname || !pname || !phone || !add || !categories || !qnt || !price) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = collection(userDocRef, "Purchase");
      await setDoc(doc(productRef, phone), {
        ...newProduct,
      });

      setProducts((prev) =>
        prev.map((product) =>
          product.phone === newProduct.phone ? { ...newProduct } : product
        )
      );
      alert("Product updated successfully!");
      setShowModal(false); // Close modal after updating product
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  // Remove Product
  const handleRemoveProduct = async (phone) => {
    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = collection(userDocRef, "Purchase");
      await deleteDoc(doc(productRef, phone));

      setProducts((prev) => prev.filter((product) => product.phone !== phone));
      alert("Product removed successfully!");
    } catch (error) {
      console.error("Error removing product: ", error);
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
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6">
        Purchase Orders
        <FontAwesomeIcon
        icon={faStore}
        className="text-5xl ml-5 text-pink-700 animate-bounce"
      />
      </h1>
      
      {/* Add Product Button */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 transition duration-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Product
      </button>

      {/* Info Box - Split into Product, Supplier, and Price Sections */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-6 mb-6">
        {/* Product Info */}
        <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300">
          <h3 className="text-xl font-semibold text-indigo-600">Total Products</h3>
          <p className="text-4xl font-bold text-yellow-500">{totalProducts}</p>
        </div>

        {/* Supplier Info */}
        <div className="bg-green-100 p-6 rounded-lg shadow-lg text-center border-2 border-green-300">
          <h3 className="text-xl font-semibold text-green-600">Total Suppliers</h3>
          <p className="text-4xl font-bold text-yellow-500">{totalSuppliers}</p>
        </div>

        {/* Price Info */}
        <div className="bg-pink-100 p-6 rounded-lg shadow-lg text-center border-2 border-pink-300">
          <h3 className="text-xl font-semibold text-pink-600">Total Purchase Price</h3>
          <p className="text-4xl font-bold text-yellow-500">${totalPurchasePrice}</p>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 shadow-md">
          <thead className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left ">Supplier</th>
              <th className="py-3 px-4 text-left ">Phone</th>
              <th className="py-3 px-4 text-left ">Address</th>
              <th className="py-3 px-4 text-left ">Categories</th>
              <th className="py-3 px-4 text-left ">Product Name</th>
              <th className="py-3 px-4 text-left ">Quantity</th>
              <th className="py-3 px-4 text-left ">Price</th>
              {/* <th className="py-3 px-4">Sales</th>
              <th className="py-3 px-4">Stock</th> */}
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.sname} className="hover:bg-yellow-100 transition duration-300">
                <td className="py-3 px-4">{product.sname}</td>
                <td className="py-3 px-4">{product.phone}</td>
                <td className="py-3 px-4">{product.add}</td>
                <td className="py-3 px-4">{product.categories}</td>
                <td className="py-3 px-4">{product.pname}</td>
                <td className="py-3 px-4">{product.qnt}</td>
                <td className="py-3 px-4">${product.price}</td>
                {/* <td className="py-3 px-4">{product.sales}</td>
                <td className="py-3 px-4">{product.stock}</td> */}
                <td className="py-3 px-4">
                  <button
                    onClick={() => {
                      setShowModal(true);
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

      {/* Modal for Add/Update Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold mb-4 text-purple-700">
              {newProduct.sname ? "Update Product" : "Add Product"}
            </h2>
            <form
              onSubmit={newProduct.sname ? handleUpdateProduct : handleAddProduct}
            >
              {/* Form Inputs for Product Details */}
              <input
                type="text"
                name="sname"
                value={newProduct.sname}
                onChange={handleInputChange}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Supplier Name"
                required
              />
              <input
                type="text"
                name="phone"
                value={newProduct.phone}
                onChange={handleInputChange}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Phone Number"
                required
              />
              <input
                type="text"
                name="add"
                value={newProduct.add}
                onChange={handleInputChange}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Address"
                required
              />
              <input
                type="text"
                name="pname"
                value={newProduct.pname}
                onChange={handleInputChange}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Product Name"
                required
              />
              <input
                type="text"
                name="categories"
                value={newProduct.categories}
                onChange={handleInputChange}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Categories"
                required
              />
              <input
                type="number"
                name="qnt"
                value={newProduct.qnt}
                onChange={handleInputChange}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Quantity"
                required
              />
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Price"
                required
              />
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-4 rounded-lg w-full transition duration-300 hover:bg-green-600"
              >
                {newProduct.sname ? "Update" : "Add"} Product
              </button>
            </form>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 text-red-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;
