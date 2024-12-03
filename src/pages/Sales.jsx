import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaShoppingCart } from "react-icons/fa";
import { auth, db } from "../config/firebase";

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
  const [invoiceData, setInvoiceData] = useState([]);
  const [user] = useAuthState(auth);

  // Calculate total products, total sales, and total quantity
  const totalProducts = products.length;
  const totalSalesPrice = products.reduce((acc, product) => acc + (product.sales || 0), 0);
  const totalQuantity = products.reduce((acc, product) => acc + (product.quantity || 0), 0);

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch Invoice Data (example from Firestore)
        const invoiceRef = collection(userDocRef, "Invoices");
        const invoiceSnapshot = await getDocs(invoiceRef);
        const invoiceList = invoiceSnapshot.docs.map((doc) => ({
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
        setInvoiceData(invoiceList);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredInvoiceData = invoiceData.filter(
    (invoice) =>
      invoice.Bno &&
      invoice.Bno.toLowerCase().includes(filters.Bno.toLowerCase()) &&
      invoice.cname &&
      invoice.cname.toLowerCase().includes(filters.cname.toLowerCase()) &&
      invoice.amount &&
      invoice.amount.toString().includes(filters.amount)
  );

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-blue-900 mb-6 flex items-center">
        Sales Management
        <FaShoppingCart className="animate-drift ml-4" />
      </h1>
      {/* Info Boxes */}
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-900 p-4 rounded-md shadow-md border-l-4 border-blue-400">
          <h3 className="text-lg font-semibold text-gray-100">Total Products</h3>
          <p className="text-3xl font-bold text-gray-100">{totalProducts}</p>
        </div>
        <div className="bg-green-900 p-4 rounded-md shadow-md border-l-4 border-green-400">
          <h3 className="text-lg font-semibold text-gray-100">Total Sales</h3>
          <p className="text-3xl font-bold text-gray-100">${totalSalesPrice}</p>
        </div>
        <div className="bg-red-900 p-4 rounded-md shadow-md border-l-4 border-red-400">
          <h3 className="text-lg font-semibold text-gray-100">Total Quantity</h3>
          <p className="text-3xl font-bold text-gray-100">{totalQuantity}</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-blue-700 p-4 rounded-md shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Filters</h3>
        <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="Bno" className="text-white block mb-1 font-semibold">
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
            <label htmlFor="cname" className="text-white block mb-1 font-semibold">
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
            <label htmlFor="pname" className="text-white block mb-1 font-semibold">
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
        </div>
      </div>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-900 text-white py-2 px-4 rounded-lg mb-4 transition hover:bg-blue-600"
      >
        Offline Billing
      </button>
      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gradient-to-r from-blue-700 to-blue-700 text-white">
          
  <tr>
    <th className="py-3 px-4 text-left">UID</th>
    <th className="py-3 px-4 text-left">Date</th>
    <th className="py-3 px-4 text-left">Client</th>
    <th className="py-3 px-4 text-left">Product</th>
    <th className="py-3 px-4 text-left">Sales</th>
    <th className="py-3 px-4 text-left">Amount</th>
    <th className="py-3 px-4 text-left">Actions</th>
  </tr>
</thead>
<tbody>
  {filteredInvoiceData.map((invoice) => (
    <tr key={invoice.id} className="hover:bg-gray-100">
      {/* UID - Invoice Number */}
      <td className="py-3 px-4">{invoice.invoiceNumber}</td>

      {/* Date - Invoice Date */}
      <td className="py-3 px-4">
        {new Date(invoice.invoiceDate).toLocaleDateString()}
      </td>

      {/* Client - Bill To Name */}
      <td className="py-3 px-4">{invoice.billTo?.name}</td>

      {/* Product - List of Products (or some aggregate value) */}
      <td className="py-3 px-4">
        {(invoice.products || [])
          .map((product) => product.name) // Assuming product has a name field
          .join(", ")} {/* Joining product names */}
      </td>

      {/* Sales - Sales (could be a total sales value if applicable) */}
      <td className="py-3 px-4">
        ₹{(invoice.products || []).reduce((acc, p) => acc + (p.total || 0), 0)}
      </td>

      {/* Amount - Total Amount */}
      <td className="py-3 px-4">
        ₹{(invoice.products || []).reduce((acc, p) => acc + (p.total || 0), 0)}
      </td>

      {/* Actions - You can add actions like edit or delete */}
      <td className="py-3 px-4">Actions</td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
