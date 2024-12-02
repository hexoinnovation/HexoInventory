import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../config/firebase";

const CustomerDetails = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    gst: "",
    aadhaar: "",
    panno: "",
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [Customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const customersRef = collection(userDocRef, "Customers");
        const customerSnapshot = await getDocs(customersRef);
        const customerList = customerSnapshot.docs.map((doc) => doc.data());
        setCustomers(customerList);
      } catch (error) {
        console.error("Error fetching customers: ", error);
      }
    };

    fetchCustomers();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      gst,
      aadhaar,
      panno,
    } = newCustomer;

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !gst ||
      !aadhaar ||
      !panno
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const customerRef = collection(userDocRef, "Customers");
      await setDoc(doc(customerRef, email), {
        ...newCustomer, // Store the entire customer object
      });

      setCustomers((prev) => [...prev, { ...newCustomer }]);
      alert("Customer added successfully!");
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        gst: "",
        aadhaar: "",
        panno: "",
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding customer: ", error);
    }
  };

  const handleRemoveCustomer = async (email) => {
    if (!user) {
      Swal.fire("Warning", "Please log in to delete a customer.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won’t be able to undo this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const customerDoc = doc(db, "admins", user.email, "Customers", email);
      await deleteDoc(customerDoc);

      setCustomers((prev) =>
        prev.filter((customer) => customer.email !== email)
      );

      Swal.fire("Deleted!", "Customer has been deleted.", "success");
    } catch (error) {
      console.error("Error deleting customer: ", error);
      Swal.fire("Error", "Failed to delete customer.", "error");
    }
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer); // Set the customer data to edit
    setNewCustomer(customer); // Fill the form fields with the current customer data
    setShowEditModal(true); // Show the edit modal
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      gst,
      aadhaar,
      panno,
    } = newCustomer;

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !gst ||
      !aadhaar ||
      !panno
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const customerRef = collection(userDocRef, "Customers");
      const customerDocRef = doc(customerRef, email);

      await updateDoc(customerDocRef, {
        ...newCustomer, // Update with new customer data
      });

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.email === email ? { ...newCustomer } : customer
        )
      );

      alert("Customer updated successfully!");
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        gst: "",
        aadhaar: "",
        panno: "",
      });
      setShowEditModal(false); // Close the edit modal
    } catch (error) {
      console.error("Error updating customer: ", error);
      alert("Failed to update customer. Please try again.");
    }
  };

  const placeholderNames = {
    name: "Customer Name",
    email: "Email",
    phone: "Phone Number",
    address: "Address",
    city: "City",
    state: "State",
    zip: "Zip Code",
    gst: "GST No",
    aadhaar: "Aadhaar No",
    panno: "PAN No",
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredCustomers = Customers.filter((customer) =>
    Object.keys(filters).every((key) =>
      customer[key]?.toLowerCase().includes(filters[key].toLowerCase())
    )
  ).filter((customer) =>
    searchQuery
      ? Object.values(customer).some((value) =>
          value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
  );

  const totalCustomers = Customers.length;
  const totalPhoneNumbers = Customers.filter(
    (customer) => customer.phone
  ).length;

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-bold text-blue-600 mb-6">
        Customer Details
        <FontAwesomeIcon icon={faUsers} className="ml-4 text-blue-600" />
      </h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-300 text-white shadow-lg">
          <h3 className="text-xl font-semibold">Total Customers</h3>
          <p className="text-4xl font-bold">{totalCustomers}</p>
        </div>
        <div className="p-6 rounded-lg bg-gradient-to-r from-green-500 to-green-300 text-white shadow-lg">
          <h3 className="text-xl font-semibold">Phone Numbers Collected</h3>
          <p className="text-4xl font-bold">{totalPhoneNumbers}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-3 p-2 bg-gradient-to-r from-blue-700 via-blue to-blue-700 rounded-lg shadow-lg">
        <div className="col-span-full">
          <label
            className="block text-lg font-semibold text-gray-100 mb-2"
            htmlFor="search"
          >
            Global Search:
          </label>
        </div>
        {["name", "email", "phone", "city", "state"].map((filterKey) => (
          <div key={filterKey} className="bg-green p-2 rounded-lg shadow-md">
            <label
              className="block text-md font-medium text-gray-100 mb-2 capitalize"
              htmlFor={filterKey}
            >
              Filter by {filterKey}:
            </label>
            <input
              type="text"
              id={filterKey}
              name={filterKey}
              placeholder={`Enter ${filterKey}...`}
              value={filters[filterKey]}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring focus:ring-blue-400 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600"
      >
        Add Customer
      </button>

      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Address</th>
              <th className="py-3 px-4 text-left">City</th>
              <th className="py-3 px-4 text-left">State</th>
              <th className="py-3 px-4 text-left">Zip Code</th>
              <th className="py-3 px-4 text-left">GST No</th>
              <th className="py-3 px-4 text-left">Aadhaar No</th>
              <th className="py-3 px-4 text-left">PAN No</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.email}
                className="hover:bg-yellow-100 text-sm sm:text-base"
              >
                <td className="py-3 px-4">{customer.name}</td>
                <td className="py-3 px-4">{customer.email}</td>
                <td className="py-3 px-4">{customer.phone}</td>
                <td className="py-3 px-4">{customer.address}</td>
                <td className="py-3 px-4">{customer.city}</td>
                <td className="py-3 px-4">{customer.state}</td>
                <td className="py-3 px-4">{customer.zip}</td>
                <td className="py-3 px-4">{customer.gst}</td>
                <td className="py-3 px-4">{customer.aadhaar}</td>
                <td className="py-3 px-4">{customer.panno}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="ml-4 text-blue-500 hover:text-blue-700"
                  >
                    <AiOutlineEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleRemoveCustomer(customer.email)}
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

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Add Customer</h2>
            <form onSubmit={handleAddCustomer}>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(placeholderNames).map((key) => (
                  <div key={key} className="flex flex-col">
                    <label htmlFor={key}>{placeholderNames[key]}</label>
                    <input
                      type="text"
                      id={key}
                      name={key}
                      value={newCustomer[key]}
                      onChange={handleInputChange}
                      className="border px-3 py-2 rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="mt-4 bg-green-500 text-white py-2 px-6 rounded-lg"
              >
                Add Customer
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

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Edit Customer</h2>
            <form onSubmit={handleUpdateCustomer}>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(placeholderNames).map((key) => (
                  <div key={key} className="flex flex-col">
                    <label htmlFor={key}>{placeholderNames[key]}</label>
                    <input
                      type="text"
                      id={key}
                      name={key}
                      value={newCustomer[key]}
                      onChange={handleInputChange}
                      className="border px-3 py-2 rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-500 text-white py-2 px-6 rounded-lg"
              >
                Update Customer
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
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

export default CustomerDetails;
