import React, { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete } from "react-icons/ai";
import { FaShoppingCart } from "react-icons/fa";
import { auth, db } from "../config/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the styles

const Sales = () => {
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    no: "",
    date: "",
    Bno: "",
    cname: "",
    pname: "",
    categories: "",
    quantity: "",
    sales: "",
    price: "",
  });
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    Bno: "",
    cname: "",
    pname: "",
    categories: "",
  });
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);

        // Fetch Sales collection
        const salesRef = collection(userDocRef, "Sales");
        const salesSnapshot = await getDocs(salesRef);
        const salesList = salesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch Purchase collection (for estock)
        const purchaseRef = collection(userDocRef, "Purchase");
        const purchaseSnapshot = await getDocs(purchaseRef);
        const purchaseData = purchaseSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Match and merge `estock` into `salesList` based on your criteria
        const combinedProducts = salesList.map((sale) => {
          const matchingPurchase = purchaseData.find(
            (purchase) => purchase.id === sale.id
          );

          return {
            ...sale,
            estock: matchingPurchase ? matchingPurchase.estock : 0,
          };
        });

        setProducts(combinedProducts);
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
    const { date, Bno, cname, pname, categories, quantity, sales, price } =
      newProduct;

    if (
      !date ||
      !Bno ||
      !cname ||
      !pname ||
      !categories ||
      !quantity ||
      !sales ||
      !price
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const productRef = collection(userDocRef, "Sales");
      await setDoc(doc(productRef, Bno), {
        ...newProduct, // Store the entire object
      });

      setProducts((prev) => [...prev, { ...newProduct }]);
      alert("Product added successfully!");
      setNewProduct({
        date: "",
        Bno: "",
        cname: "",
        pname: "",
        categories: "",
        quantity: "",
        sales: "",
        price: "",
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const handleRemoveProduct = async (Bno) => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "User Not Authenticated",
        text: "Please log in to delete a product.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Confirm deletion with SweetAlert2
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

    if (!result.isConfirmed) return; // Exit if the user cancels

    try {
      const productDoc = doc(db, "admins", user.email, "Sales", Bno);

      // Delete product from Firestore
      await deleteDoc(productDoc);

      // Update the products state
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.Bno !== Bno)
      );

      // Success SweetAlert
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Product has been deleted successfully.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      console.error("Error deleting product: ", error.message);

      // Error SweetAlert
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to delete product. Please try again.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#d33",
      });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.pname &&
      product.pname.toLowerCase().includes(filters.pname.toLowerCase()) &&
      product.categories &&
      product.categories
        .toLowerCase()
        .includes(filters.categories.toLowerCase()) &&
      product.Bno &&
      product.Bno.toLowerCase().includes(filters.Bno.toLowerCase()) &&
      product.cname &&
      product.cname.toLowerCase().includes(filters.cname.toLowerCase())
  );

  // Info Box Calculations
  const totalProducts = filteredProducts.length;
  const totalSalesPrice = filteredProducts
    .reduce((total, product) => total + product.sales * product.price, 0)
    .toFixed(2);
  const totalQuantity = filteredProducts
    .reduce((total, product) => total + parseInt(product.quantity), 0)
    .toFixed(0);

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-6 flex items-center">
        Sales Management
        <FaShoppingCart className="animate-drift ml-4" />
      </h1>
      {/* Info Boxes */}
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-900 p-4 rounded-md shadow-md border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-gray-100">
            Total Products
          </h3>
          <p className="text-3xl font-bold text-gray-100">{totalProducts}</p>
        </div>
        <div className="bg-green-900 p-4 rounded-md shadow-md border-l-4 border-green-400">
          <h3 className="text-lg font-semibold text-gray-100">Total Sales</h3>
          <p className="text-3xl font-bold text-gray-100">${totalSalesPrice}</p>
        </div>
        <div className="bg-red-900 p-4 rounded-md shadow-md border-l-4 border-red-400">
          <h3 className="text-lg font-semibold text-gray-100">
            Total Quantity
          </h3>
          <p className="text-3xl font-bold text-gray-100">{totalQuantity}</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-blue-700 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="Bno"
              className="text-white block mb-1 font-semibold"
            >
              Bill Number
            </label>
            <input
              type="text"
              id="Bno"
              name="Bno"
              value={filters.Bno}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Bill No."
            />
          </div>
          <div>
            <label
              htmlFor="cname"
              className="text-white block mb-1 font-semibold"
            >
              Customer Name
            </label>
            <input
              type="text"
              id="cname"
              name="cname"
              value={filters.cname}
              onChange={handleFilterChange}
              className="p-2 w-full border border-gray-300 rounded-md"
              placeholder="Filter by Customer Name"
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
        onClick={() => setShowModal(true)}
        className="bg-blue-900 text-white py-2 px-4 rounded-lg mb-4 transition hover:bg-blue-600"
      >
        Offline Billing
      </button>

      {/* Product Table */}
      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gradient-to-r from-blue-700 to-blue-700 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Bill No.</th>
              <th className="py-3 px-4 text-left">Customer</th>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Categories</th>
              <th className="py-3 px-4 text-left">Sales</th>
              <th className="py-3 px-4 text-left">Price</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr
                key={product.Bno}
                className="hover:bg-yellow-100 text-sm sm:text-base"
              >
                <td className="py-3 px-4">{product.Bno}</td>
                <td className="py-3 px-4">{product.cname}</td>
                <td className="py-3 px-4">{product.pname}</td>
                <td className="py-3 px-4">{product.categories}</td>
                <td className="py-3 px-4">{product.sales}</td>
                <td className="py-3 px-4">{product.price}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleRemoveProduct(product.Bno)}
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
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl mb-4">Offline Billing</h2>
            <form onSubmit={handleAddProduct}>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(newProduct).map((key) => (
                  <div key={key} className="flex flex-col">
                    <label htmlFor={key} className="mb-2">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    {key === "date" ? (
                      <DatePicker
                        selected={
                          newProduct.date ? new Date(newProduct.date) : null
                        }
                        onChange={(date) =>
                          handleInputChange({
                            target: { name: key, value: date.toISOString() },
                          })
                        }
                        className="border px-3 py-2 rounded-lg"
                        dateFormat="yyyy/MM/dd"
                        placeholderText="Select Date"
                      />
                    ) : (
                      <input
                        type="text"
                        id={key}
                        name={key}
                        value={newProduct[key]}
                        onChange={handleInputChange}
                        className="border px-3 py-2 rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="mt-4 bg-green-500 text-white py-2 px-6 rounded-lg"
              >
                Offline Billing
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="mt-4 ml-2 bg-gray-500 text-white py-2 px-6 rounded-lg"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
