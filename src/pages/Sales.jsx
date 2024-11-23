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
import { FaShoppingCart } from 'react-icons/fa';
import { faStore } from "@fortawesome/free-solid-svg-icons";

// The Sales Component
const Sales = () => {
  const [showModal, setShowModal] = useState(false); // For modal visibility
  const [newProduct, setNewProduct] = useState({
    no: "",
    date: "",
    Bno: "",
    cname: "",
    pname: "",
    categories:"",
    quantity: 0,
    sales: "",
    stock: "",
    price: "",
    total: 0,
  });

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // For searching/filtering products
  const [user] = useAuthState(auth); // To get the current authenticated user

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const productsRef = collection(userDocRef, "Sales");
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
    setNewSales((prev) => ({ ...prev, [name]: value }));
  };

  // Add New Product
  const handleAddProduct = async (e) => {
    e.preventDefault();

    const {  date, Bno, cname, pname, categories ,quantity, sales, stock, price } = newProduct;
    if (  !date || !Bno || !cname || !pname || !categories ||!quantity ||! stock||  !sales || !price) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = collection(userDocRef, "Sales");
      await setDoc(doc(productRef, Bno), {
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
    date: "",
    Bno: "",
    cname: "",
    pname: "",
    categories:"",
    quantity: 0,
    stock:"",
    sales: "",
    price: "",
    total: 0,
      });
      setShowModal(false); // Close modal after adding product
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  // Update Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    const {  no, date, Bno, cname, pname,categories, quantity,stock, sales, price } = newProduct;
    if (!no || !date || !Bno || !cname || !pname ||!categories|| !quantity ||!stock|| !sales || !price) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = collection(userDocRef, "Sales");
      await setDoc(doc(productRef, Bno), {
        ...newProduct,
      });

      setProducts((prev) =>
        prev.map((product) =>
          product.Bno === newProduct.Bno ? { ...newProduct } : product
        )
      );
      alert("Product updated successfully!");
      setShowModal(false); // Close modal after updating product
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  // Remove Product
  const handleRemoveProduct = async (Bno) => {
    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = collection(userDocRef, "Sales");
      await deleteDoc(doc(productRef, Bno));

      setProducts((prev) => prev.filter((product) => product.Bno !== Bno));
      alert("Product removed successfully!");
    } catch (error) {
      console.error("Error removing product: ", error);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.pname &&
      product.pname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Purchase Info: Product, Supplier, and Price
  const totalProducts = filteredProducts.length;
 
  const totalSalesPrice = filteredProducts
    .reduce(
      (total, product) =>
        total + parseFloat(product.price) * parseInt(product.quantity),
      0
    )
    .toFixed(2);

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-purple-50 via-pink-100 to-yellow-100 rounded-lg shadow-xl">
     <h1 className="text-5xl font-extrabold text-pink-700 mb-6 flex items-center">
    Sales Management
    <FaShoppingCart className="animate-drift mr-4" />
  </h1>
      
      {/* Add Product Button */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 transition duration-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Offline Billing
      </button>

      {/* Info Box - Split into Product, Supplier, and Price Sections */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-6 mb-6">
        {/* Product Info */}
        <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300">
          <h3 className="text-xl font-semibold text-indigo-600">Total Products</h3>
          <p className="text-4xl font-bold text-yellow-500">{totalProducts}</p>
        </div>

        {/* Price Info */}
        <div className="bg-pink-100 p-6 rounded-lg shadow-lg text-center border-2 border-pink-300">
          <h3 className="text-xl font-semibold text-pink-600">Total Sales Price</h3>
          <p className="text-4xl font-bold text-yellow-500">${totalSalesPrice}</p>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 shadow-md">
          <thead className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white">
            <tr>
            <th className="py-3 px-4 text-left">Invoice No.</th>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Price</th>
              <th className="py-3 px-4 text-left">Stock</th>
              <th className="py-3 px-4 text-left">Sales</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.Bno} className="hover:bg-yellow-100 transition duration-300">
                <td className="py-3 px-4">{product.no}</td>
                 <td className="py-3 px-4">{product.cname}</td>
                 <td className="py-3 px-4">{product.date}</td>
                 <td className="py-3 px-4">{product.Bno}</td>
                <td className="py-3 px-4">{product.pname}</td>
                <td className="py-3 px-4">{product.categories}</td>
                <td className="py-3 px-4">{product.stock}</td>
                <td className="py-3 px-4">{product.sales}</td>
                <td className="py-3 px-4">${product.price}</td>
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
                    onClick={() => handleRemoveProduct(product.Bno)}
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
              {newProduct.pname ? "Update Product" : "Offline Billing "}
            </h2>
            <form
              onSubmit={handleAddProduct}
            >
              {/* Form Inputs for Product Details */}
              <input
                type="text"
                name="cname"
                value={newProduct.cname}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Customer Name"
                required
              />
              <input
                type="date"
                name="Billing Date"
                value={newProduct.date}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Billing Date"
              />
              <input
                type="number"
                name="Bno"
                value={newProduct.Bno}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Billing No"
                required
              />
              <input
                type="text"
                name="pname"
                value={newProduct.pname}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Product Name"
                required
              />
              <input
                type="text"
                name="categories"
                value={newProduct.categories}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Categories"
                required
              />
              <input
                type="number"
                name="quantity"
                value={newProduct.quantity}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Quantity"
                required
              />
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Price"
                required
              />
               <input
                type="number"
                name="stock"
                value={newProduct.stock}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Stock Count"
                required
              />
               <input
                type="number"
                name="sales"
                value={newProduct.sales}
                onChange={(e) =>setNewProduct(e.target.value)}
                className="w-full mb-2 p-2 border-2 border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500"
                placeholder="Sales Count"
                required
              />
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-4 rounded-lg w-full transition duration-300 hover:bg-green-600"
              >
                {newProduct.Bno ? "Add" : "Add"} Offline Billing 
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

export default Sales;
