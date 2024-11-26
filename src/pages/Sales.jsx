import React, { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  query, orderBy 
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete } from "react-icons/ai";
import { FaShoppingCart } from "react-icons/fa";
import { auth, db } from "../config/firebase"; // Replace with your Firebase configuration path
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the styles
import { getAuth } from "firebase/auth";

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
    // cstock: "",
    sales: "",
    price: "",
  });
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
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
            (purchase) => purchase.id === sale.id // Adjust this matching condition if necessary
          );
  
          return {
            ...sale,
            estock: matchingPurchase ? matchingPurchase.estock : 0, // Default to 0 if no match
          };
        });
  
        setProducts(combinedProducts);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };
  
    fetchProducts();
  }, [user]);

  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     if (!user) return;

  //     try {
  //       const userDocRef = doc(db, "admins", user.email);
  //       const productsRef = collection(userDocRef, "Sales");
  //       const productSnapshot = await getDocs(productsRef);
  //       const productList = productSnapshot.docs.map((doc) => doc.data());
  //       setProducts(productList);
  //     } catch (error) {
  //       console.error("Error fetching products: ", error);
  //     }
  //   };

  //   fetchProducts();
  // }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const {
      date,
      Bno,
      cname,
      pname,
      categories,
      quantity,
      // cstock,
      sales,
      price,
    } = newProduct;

    if (
      !date ||
      !Bno ||
      !cname ||
      !pname ||
      !categories ||
      !quantity ||
      // !cstock ||
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
        // cstock: "",
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
      alert("User not authenticated.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      const productDoc = doc(db, "admins", user.email, "Sales", Bno);

      await deleteDoc(productDoc);

      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.Bno !== Bno)
      );

      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product: ", error.message);
      alert("Failed to delete product. Please try again.");
    }
  };
  const RemoveProduct = async (invoiceId,invoiceNumber) => {
    if (!user) {
      alert("User not authenticated.");
      return;
    }
  
    const confirmDelete = window.confirm("Are you sure you want to delete this invoice?");
    if (!confirmDelete) return;
  
    // Debugging log to check invoiceId
    console.log("Deleting invoice with invoiceId: ", invoiceId);
  
    try {
      if (!invoiceId) {
        alert("Invoice ID is missing. Please try again.");
        return;
      }
  
      // Reference to the specific invoice document
      const userDocRef = doc(db, "admins", user.email);
      const invoiceRef = doc(collection(userDocRef, "Invoices"), invoiceId);
  
      // Ensure that the invoiceRef path is valid
      console.log("Invoice reference path:", invoiceRef.path);
  
      // Delete the invoice document
      await deleteDoc(invoiceRef);
  
      // Update the products state or handle UI update
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.invoiceNumber !== invoiceNumber) // Ensure correct property for filtering
      );
  
      alert("Invoice deleted successfully!");
    } catch (error) {
      console.error("Error deleting invoice: ", error.message);
      alert("Failed to delete invoice. Please try again.");
    }
  };
  
  const placeholderNames = {
    no: "Serial No.",
    date: "Select Date",
    Bno: "Bill No.",
    cname: "Customer Name",
    pname: "Product Name",
    categories: "Categories",
    quantity: "Quantity",
    // cstock: "Current Stock",
    sales: "Sales Count",
    price: "Price",
  };

  const filteredProducts = products.filter(
    (product) =>
      product.pname && 
      product.pname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProducts = filteredProducts.length;
  const totalSalesPrice = filteredProducts
    .reduce((total, product) => total + product.quantity * product.price, 0)
    .toFixed(2);
    const [invoiceData, setInvoiceData] = useState([]); // Store invoices data
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchInvoiceData = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
  
        if (user) {
          try {
            // Reference to the user's document in Firestore
            const userDocRef = doc(db, "admins", user.email);
  
            // Query the 'Invoices' collection to fetch all invoice data
            const invoiceQuery = query(
              collection(userDocRef, "Invoices"),
              orderBy("createdAt", "desc") // Order by the latest createdAt field
            );
  
            const querySnapshot = await getDocs(invoiceQuery);
  
            // Map through the query results and set the invoice data
            const fetchedData = [];
            querySnapshot.forEach((doc) => {
              fetchedData.push(doc.data());
            });
  
            setInvoiceData(fetchedData); // Set the invoice data
          } catch (error) {
            console.error("Error fetching invoice data:", error);
          }
        } else {
          console.log("No user is signed in.");
        }
        setLoading(false);
      };
  
      fetchInvoiceData();
    }, []);
  
    // Calculate the remaining stock based on sales
    const calculateRemainingStock = (stock, sales) => {
      return stock - sales;
    };
  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-purple-50 via-pink-100 to-yellow-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6 flex items-center">
        Sales Management
        <FaShoppingCart className="animate-drift ml-4" />
      </h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 transition hover:bg-blue-600"
      >
        Offline Billing
      </button>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-xl font-semibold text-indigo-600">Total Products</h3>
          <p className="text-4xl font-bold text-yellow-500">{totalProducts}</p>
        </div>
        <div className="bg-pink-100 p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-xl font-semibold text-pink-600">Total Sales Price</h3>
          <p className="text-4xl font-bold text-yellow-500">${totalSalesPrice}</p>
        </div>
      </div>

      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className= "bg-gradient-to-r from-pink-500 to-yellow-500 text-white" >
            <tr>
              <th className="py-3 px-4 text-left">Bill No.</th>
              <th className="py-3 px-4 text-left">Product</th>
              <th className="py-3 px-4 text-left">Categories</th>
              <th className="py-3 px-4 text-left">Price</th>
              {/* <th className="py-3 px-4 text-left">Current Stock</th> */}
              <th className="py-3 px-4 text-left">Sales</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.map((invoice, index) => (
              invoice.products.map((product, productIndex) => (
                <tr key={`${index}-${productIndex}`}>
                  <td className="py-3 px-4">{invoice.invoiceNumber}</td>
                  <td className="py-3 px-4">{product.description}</td>
                  <td className="py-3 px-4">{product.Category}</td>
                  <td className="py-3 px-4">{product.rate}</td>
                  {/* <td className="py-3 px-4">{product.cstock}</td> */}
                  
                  <td className="py-3 px-4">{product.quantity}</td>
                  <td className="py-3 px-4">
                  <button
  onClick={() => RemoveProduct(invoice.invoiceNumber)} // Pass invoiceId to the function
  className="ml-4 text-red-500 hover:text-red-700"
>
  <AiOutlineDelete size={20} />
</button>

                </td>
                </tr>
              ))
            ))}
          </tbody>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.Bno} className="hover:bg-yellow-100 text-sm sm:text-base">
                <td className="py-3 px-4">{product.Bno}</td>
                <td className="py-3 px-4">{product.pname}</td>
                <td className="py-3 px-4">{product.categories}</td>
                <td className="py-3 px-4">${product.price}</td>
               
                <td className="py-3 px-4">{product.sales}</td>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Offline Billing</h2>
            <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-2 gap-4">
  {Object.keys(placeholderNames).map((key) => (
    <div key={key} className="flex flex-col">
      <label htmlFor={key}>
        {placeholderNames[key]}
      </label>

      {/* Use DatePicker for the date field */}
      {key === "date" ? (
        <DatePicker
          selected={newProduct.date ? new Date(newProduct.date) : null}
          onChange={(date) => handleInputChange({ target: { name: key, value: date.toISOString() } })}
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
