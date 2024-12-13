import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  setDoc,
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
  const [newCategory, setNewCategory] = useState([]);
   const [category, setCategory] = useState([]);
   const [productCategory, setProductCategory] = useState('');
  // const [newProduct, setNewProduct] = useState({
  //   name: "",
  //   price: "",
  //   image: "",
  //   category: "",
  //   description: "",
  //   stock: "",
  //   discount: "",
  //   sku: "",
  //   color: "",  // New field for color
  //   rating: 0,
  //   supplier: "",
  //   warranty: "",
  // });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    color: '#000000',
    rating: 1,
    price: '',
    category: '',
    stock: '',
    discount: '',
    image: null,
  });
  const [editProductId, setEditProductId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <p>Loading...</p>;
  }

  const productsCollection = collection(
    db,
   
    "products"
  );

  const categoriesCollection = collection(
    db,
   
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
    // Generate the custom document ID
    const docId = `${productCategory}-${Date.now()}`; // Using timestamp for uniqueness
    const newDocRef = doc(productsCollection, docId); // Reference with custom ID

    // Save the product data with the custom ID
    await setDoc(newDocRef, {
      ...newProduct,
      Category: productCategory,
    });

    // Update the local state
    setProducts([
      ...products,
      { ...newProduct, id: docId, Category: productCategory }
    ]);

    // Reset the form
    resetForm();
  } catch (error) {
    console.error("Error adding product: ", error);
  }
};
  const handleUpdateProduct = async () => {
    try {
      const productDoc = doc(
        db,
      
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
      const productDoc = doc(db, "products", id);
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
      name: '',
      description: '',
      color: '#000000',
      rating: 1,
      price: '',
      category: '',
      stock: '',
      discount: '',
      image: null,
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
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
        Manage Products
      </h1>

      {/* Info Boxes */}
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Total Products</h2>
          <p className="text-3xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Products in Stock</h2>
          <p className="text-3xl font-bold">{productsInStock}</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Average Price</h2>
          <p className="text-3xl font-bold">${averagePrice}</p>
        </div>
        <div className="bg-pink-500 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Products with Discounts</h2>
          <p className="text-3xl font-bold">{productsWithDiscounts}</p>
        </div>
      </div>

     {/* Two-Column Layout */}
<div className="grid grid-cols-[30%,70%] lg:grid-cols-[30%,70%] gap-8">
  {/* Product Form */}
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-semibold text-blue-500 mb-4">
      {editProductId ? "Edit Product" : "Add Product"}
    </h2>
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Product Name"
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        value={newProduct.name}
        onChange={(e) =>
          setNewProduct({ ...newProduct, name: e.target.value })
        }
      />
      <textarea
        placeholder="Description"
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 h-24"
        value={newProduct.description}
        onChange={(e) =>
          setNewProduct({ ...newProduct, description: e.target.value })
        }
      ></textarea>

      <input
        type="color"
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        value={newProduct.color}
        onChange={(e) =>
          setNewProduct({ ...newProduct, color: e.target.value })
        }
      />
      <input
        type="number"
        placeholder="Price"
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        value={newProduct.price}
        onChange={(e) =>
          setNewProduct({ ...newProduct, price: e.target.value })
        }
      />
      <select
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
      <div>
          <label>Category:</label>
          <div>
            <input
              type="radio"
              id="bestProduct"
              name="productCategory"
              value="best_product"
              checked={productCategory === 'best_product'}
              onChange={() => setProductCategory('best_product')}
            />
            <label htmlFor="bestProduct">Best Product</label>

            <input
              type="radio"
              id="offerProduct"
              name="productCategory"
              value="offer_product"
              checked={productCategory === 'offer_product'}
              onChange={() => setProductCategory('offer_product')}
            />
            <label htmlFor="offerProduct">Offer Product</label>
          </div>
        </div>
      <input
        type="number"
        placeholder="Stock Quantity"
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        value={newProduct.stock}
        onChange={(e) =>
          setNewProduct({ ...newProduct, stock: e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Discount (%)"
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        value={newProduct.discount}
        onChange={(e) =>
          setNewProduct({ ...newProduct, discount: e.target.value })
        }
      />

      <input
        type="file"
        accept="image/*"
        className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
        onClick={editProductId ? handleUpdateProduct : handleAddProduct}
      >
        {editProductId ? "Update Product" : "Add Product"}
      </button>
      <button
        className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200"
        onClick={resetForm}
      >
        Clear Form
      </button>
    </div>
  </div>
        {/* Product List */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            Product List
          </h2>
          <div className="overflow-x-auto">
  <table className="table-auto w-full border-collapse border border-gray-300">
    <thead>
      <tr className="bg-blue-100 text-blue-700">
        <th className="border p-3">Image</th>
        <th className="border p-3">Name</th>
        <th className="border p-3">Category</th>
        <th className="border p-3">Description</th>
        <th className="border p-3">Color</th>
      
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
          <tr key={product.id} className="hover:bg-gray-50">
            <td className="border p-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
            </td>
            <td className="border p-3">{product.name}</td>
            <td className="border p-3">{product.category}</td>
            <td className="border p-3">{product.description}</td>
            <td className="border p-3">
              <div
                className="w-8 h-8"
                style={{ backgroundColor: product.color }}
              ></div>
            </td>
          
            <td className="border p-3">${product.price}</td>
            <td className="border p-3">{product.stock}</td>
            <td className="border p-3 flex justify-around">
              <FontAwesomeIcon
                icon={faEdit}
                className="text-yellow-500 cursor-pointer hover:scale-110 transition-transform duration-200"
                onClick={() => handleEditProduct(product)}
              />
              <FontAwesomeIcon
                icon={faTrash}
                className="text-red-500 cursor-pointer hover:scale-110 transition-transform duration-200"
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
    </div>
  );
};

export default ManageProducts;