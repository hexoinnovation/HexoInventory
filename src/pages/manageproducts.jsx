import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../Authcontext";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    image: "",
    category: "",
    description: "",
    stock: "",
    discount: "",
    sku: "",
    supplier: "",
    warranty: "",
  });
  const [editProductId, setEditProductId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <p>Loading...</p>;
  }

  const productsCollection = collection(
    db,
    "users",
    currentUser.email,
    "products"
  );

  const categoriesCollection = collection(
    db,
    "users",
    currentUser.email,
    "categories"
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsData = await getDocs(productsCollection);
        setProducts(
          productsData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        );

        const categoriesData = await getDocs(categoriesCollection);
        setCategories(
          categoriesData.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        );
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewProduct({ ...newProduct, image: event.target.result });
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async () => {
    try {
      const newDoc = await addDoc(productsCollection, newProduct);
      setProducts([...products, { ...newProduct, id: newDoc.id }]);
      resetForm();
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const productDoc = doc(
        db,
        "users",
        currentUser.email,
        "products",
        editProductId
      );
      await updateDoc(productDoc, newProduct);
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === editProductId ? { ...product, ...newProduct } : product
        )
      );
      resetForm();
    } catch (error) {
      console.error("Error updating product: ", error);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const productDoc = doc(db, "users", currentUser.email, "products", id);
      await deleteDoc(productDoc);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id)
      );
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  const handleEditProduct = (product) => {
    setEditProductId(product.id);
    setNewProduct(product);
    setPreviewImage(product.image || null);
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      price: "",
      image: "",
      category: "",
      description: "",
      stock: "",
      discount: "",
      sku: "",
      supplier: "",
      warranty: "",
    });
    setEditProductId(null);
    setPreviewImage(null);
  };

  // Info Box Metrics
  const totalProducts = products.length;
  const productsInStock = products.reduce(
    (acc, product) => acc + (parseInt(product.stock, 10) > 0 ? 1 : 0),
    0
  );
  const averagePrice =
    products.length > 0
      ? (
          products.reduce(
            (acc, product) => acc + parseFloat(product.price || 0),
            0
          ) / products.length
        ).toFixed(2)
      : 0;
  const productsWithDiscounts = products.filter(
    (product) => parseInt(product.discount, 10) > 0
  ).length;

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
        Manage Products
      </h1>

      {/* Info Boxes */}
      <div className="grid grid-cols-4 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Total Products</h2>
          <p className="text-3xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Products in Stock</h2>
          <p className="text-3xl font-bold">{productsInStock}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Average Price</h2>
          <p className="text-3xl font-bold">${averagePrice}</p>
        </div>
        <div className="bg-pink-500 text-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Products with Discounts</h2>
          <p className="text-3xl font-bold">{productsWithDiscounts}</p>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8">
        {/* Product Form */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            {editProductId ? "Edit Product" : "Add Product"}
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Product Name"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Price"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newProduct.price}
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: e.target.value })
              }
            />
            <select
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Description"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 transition"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            ></textarea>
            <input
              type="number"
              placeholder="Stock Quantity"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newProduct.stock}
              onChange={(e) =>
                setNewProduct({ ...newProduct, stock: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Discount (%)"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={newProduct.discount}
              onChange={(e) =>
                setNewProduct({ ...newProduct, discount: e.target.value })
              }
            />
            <input
              type="file"
              accept="image/*"
              className="w-full border border-blue-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              onChange={handleImageUpload}
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="w-32 h-32 object-cover rounded mt-4"
              />
            )}
          </div>
          <div className="mt-4 flex justify-between">
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
              onClick={editProductId ? handleUpdateProduct : handleAddProduct}
            >
              {editProductId ? "Update Product" : "Add Product"}
            </button>
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
              onClick={resetForm}
            >
              Clear Form
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            Product List
          </h2>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100 text-blue-700">
                <th className="border p-3">Image</th>
                <th className="border p-3">Name</th>
                <th className="border p-3">Category</th>
                <th className="border p-3">Price</th>
                <th className="border p-3">Stock</th>
                <th className="border p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No products available.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-100 transition">
                    <td className="border p-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="border p-3">{product.name}</td>
                    <td className="border p-3">{product.category}</td>
                    <td className="border p-3">${product.price}</td>
                    <td className="border p-3">{product.stock}</td>
                    <td className="border p-3 flex justify-around">
                      <FontAwesomeIcon
                        icon={faEdit}
                        className="text-yellow-500 cursor-pointer"
                        onClick={() => handleEditProduct(product)}
                      />
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="text-red-500 cursor-pointer"
                        onClick={() => handleDeleteProduct(product.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;
