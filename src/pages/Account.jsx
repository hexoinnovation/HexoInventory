import React, { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaPlusCircle } from 'react-icons/fa';

const Products = () => {
  const [categories, setCategories] = useState(['Electronics', 'Clothing', 'Accessories', 'Books']);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [products, setProducts] = useState([
    { id: 1, name: 'Product 1', price: 100, stock: 50, category: 'Electronics' },
    { id: 2, name: 'Product 2', price: 200, stock: 30, category: 'Clothing' },
  ]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '' });

  const [orders, setOrders] = useState([
    { id: 1, productName: 'Product 1', quantity: 2, total: 200, status: 'Pending' },
    { id: 2, productName: 'Product 2', quantity: 1, total: 200, status: 'Shipped' },
  ]);

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
    setNewCategory('');
    setCategoryModalOpen(false);
  };

  const handleAddProduct = () => {
    const newId = products.length ? products[products.length - 1].id + 1 : 1;
    setProducts([...products, { ...newProduct, id: newId }]);
    setAddModalOpen(false);
    setNewProduct({ name: '', price: '', stock: '', category: '' });
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const handleDeleteCategory = (category) => {
    setCategories(categories.filter(cat => cat !== category));
  };

  const handleDeleteOrder = (id) => {
    setOrders(orders.filter(order => order.id !== id));
  };

  return (
    <div className="p-6 bg-gradient-to-r from-indigo-100 to-blue-100 min-h-screen">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Manage Products, Categories & Orders</h2>

      {/* Buttons to Add Product or Category */}
      <button
        onClick={() => setAddModalOpen(true)}
        className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white py-3 px-6 rounded-lg mb-6 flex items-center hover:bg-gradient-to-l hover:from-orange-500 hover:to-yellow-600"
      >
        <FaPlusCircle className="mr-3" /> Add New Product
      </button>
      <button
        onClick={() => setCategoryModalOpen(true)}
        className="bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 px-6 rounded-lg mb-6 flex items-center hover:bg-gradient-to-l hover:from-pink-500 hover:to-purple-600"
      >
        <FaPlusCircle className="mr-3" /> Add New Category
      </button>

      {/* Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">Add New Product</h3>
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="border px-4 py-2 mb-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="border px-4 py-2 mb-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="number"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              className="border px-4 py-2 mb-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="border px-4 py-2 mb-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Select Category</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddProduct}
              className="bg-indigo-500 text-white py-2 px-4 rounded-lg mr-2 hover:bg-indigo-600"
            >
              Add Product
            </button>
            <button
              onClick={() => setAddModalOpen(false)}
              className="bg-gray-300 text-black py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-xl font-semibold mb-4 text-pink-600">Add New Category</h3>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border px-4 py-2 mb-4 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <button
              onClick={handleAddCategory}
              className="bg-pink-500 text-white py-2 px-4 rounded-lg mr-2 hover:bg-pink-600"
            >
              Add Category
            </button>
            <button
              onClick={() => setCategoryModalOpen(false)}
              className="bg-gray-300 text-black py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Display Categories */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 p-4 border-b bg-purple-100">Categories</h3>
        <ul className="p-4">
          {categories.map((category, index) => (
            <li key={index} className="border-b py-2 flex justify-between items-center text-gray-700">
              {category}
              <button onClick={() => handleDeleteCategory(category)} className="text-red-500 hover:text-red-700">
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Display Products */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 p-4 border-b bg-blue-100">Products</h3>
        <table className="min-w-full table-auto">
          <thead className="bg-indigo-200 text-indigo-800">
            <tr>
              <th className="border px-4 py-3 text-left">Product Name</th>
              <th className="border px-4 py-3 text-left">Price</th>
              <th className="border px-4 py-3 text-left">Stock</th>
              <th className="border px-4 py-3 text-left">Category</th>
              <th className="border px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-indigo-50 transition-all">
                <td className="border px-4 py-3 text-gray-700">{product.name}</td>
                <td className="border px-4 py-3 text-gray-700">${product.price}</td>
                <td className="border px-4 py-3 text-gray-700">{product.stock}</td>
                <td className="border px-4 py-3 text-gray-700">{product.category}</td>
                <td className="border px-4 py-3 text-gray-700 flex space-x-3">
                  <button className="text-blue-500 hover:text-blue-700"><FaEye /></button>
                  <button className="text-green-500 hover:text-green-700"><FaEdit /></button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Display Orders */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 p-4 border-b bg-green-100">Orders</h3>
        <table className="min-w-full table-auto">
          <thead className="bg-green-200 text-green-800">
            <tr>
              <th className="border px-4 py-3 text-left">Product Name</th>
              <th className="border px-4 py-3 text-left">Quantity</th>
              <th className="border px-4 py-3 text-left">Total</th>
              <th className="border px-4 py-3 text-left">Status</th>
              <th className="border px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-green-50 transition-all">
                <td className="border px-4 py-3 text-gray-700">{order.productName}</td>
                <td className="border px-4 py-3 text-gray-700">{order.quantity}</td>
                <td className="border px-4 py-3 text-gray-700">${order.total}</td>
                <td className="border px-4 py-3 text-gray-700">{order.status}</td>
                <td className="border px-4 py-3 text-gray-700 flex space-x-3">
                  <button className="text-blue-500 hover:text-blue-700"><FaEye /></button>
                  <button className="text-green-500 hover:text-green-700"><FaEdit /></button>
                  <button onClick={() => handleDeleteOrder(order.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
