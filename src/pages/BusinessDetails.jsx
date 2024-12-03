import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faBuilding,
  faCalculator,
} from "@fortawesome/free-solid-svg-icons";
import { auth, db } from "../config/firebase";

const BusinessDetails = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    businessName: "",
    registrationNumber: "",
    contactNumber: "",
    city: "",
    state: "",
    gstNumber: "",
  });
  const [filters, setFilters] = useState({
    businessName: "",
    registrationNumber: "",
    contactNumber: "",
    city: "",
    state: "",
    gstNumber: "",
  });
  const [businesses, setBusinesses] = useState([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "admins", user.email);
        const businessesRef = collection(userDocRef, "Businesses");
        const businessSnapshot = await getDocs(businessesRef);
        const businessList = businessSnapshot.docs.map((doc) => doc.data());
        setBusinesses(businessList);
      } catch (error) {
        console.error("Error fetching businesses: ", error);
      }
    };

    fetchBusinesses();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBusiness((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBusiness = async (e) => {
    e.preventDefault();
    if (Object.values(newBusiness).some((field) => !field)) {
      return Swal.fire("Error", "Please fill all fields.", "error");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const businessRef = collection(userDocRef, "Businesses");
      await setDoc(
        doc(businessRef, newBusiness.registrationNumber),
        newBusiness
      );

      setBusinesses((prev) => [...prev, newBusiness]);
      Swal.fire("Success", "Business added successfully!", "success");
      closeModal();
    } catch (error) {
      console.error("Error adding business: ", error);
      Swal.fire("Error", "Failed to add business.", "error");
    }
  };

  const handleRemoveBusiness = async (registrationNumber) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won’t be able to undo this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const businessDoc = doc(
        db,
        "admins",
        user.email,
        "Businesses",
        registrationNumber
      );
      await deleteDoc(businessDoc);

      setBusinesses((prev) =>
        prev.filter(
          (business) => business.registrationNumber !== registrationNumber
        )
      );

      Swal.fire("Deleted!", "Business has been deleted.", "success");
    } catch (error) {
      console.error("Error deleting business: ", error);
      Swal.fire("Error", "Failed to delete business.", "error");
    }
  };

  const handleEditBusiness = (business) => {
    setIsEditMode(true);
    setNewBusiness(business);
    setShowModal(true);
  };

  const handleUpdateBusiness = async (e) => {
    e.preventDefault();
    if (Object.values(newBusiness).some((field) => !field)) {
      return Swal.fire("Error", "Please fill all fields.", "error");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const businessRef = collection(userDocRef, "Businesses");
      const businessDocRef = doc(businessRef, newBusiness.registrationNumber);

      await updateDoc(businessDocRef, newBusiness);

      setBusinesses((prev) =>
        prev.map((business) =>
          business.registrationNumber === newBusiness.registrationNumber
            ? newBusiness
            : business
        )
      );

      Swal.fire("Success", "Business updated successfully!", "success");
      closeModal();
    } catch (error) {
      console.error("Error updating business: ", error);
      Swal.fire("Error", "Failed to update business.", "error");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setNewBusiness({
      businessName: "",
      registrationNumber: "",
      contactNumber: "",
      city: "",
      state: "",
      gstNumber: "",
    });
  };

  const filteredBusinesses = businesses.filter((business) =>
    Object.keys(filters).every((key) =>
      business[key]?.toLowerCase().includes(filters[key]?.toLowerCase() || "")
    )
  );

  const placeholderNames = {
    businessName: "Business Name",
    registrationNumber: "Registration Number",
    contactNumber: "Contact Number",
    city: "City",
    state: "State",
    gstNumber: "GST Number",
  };

  const totalBusinesses = businesses.length;
  const totalGSTNumbers = businesses.filter((b) => b.gstNumber).length;
  const totalStates = new Set(businesses.map((b) => b.state)).size;

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-blue-100 via-white to-blue-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-bold text-blue-900 mb-6">
        Business Details
        <FontAwesomeIcon icon={faBriefcase} className="ml-4" />
      </h1>

      {/* Info Boxes */}
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="p-6 rounded-lg bg-gradient-to-r from-blue-900 to-blue-400 text-white shadow-lg">
          <h3 className="text-lg font-semibold">Total Businesses</h3>
          <p className="text-4xl font-bold">{totalBusinesses}</p>
        </div>
        <div className="p-6 rounded-lg bg-gradient-to-r from-green-900 to-green-400 text-white shadow-lg">
          <h3 className="text-lg font-semibold">Total GST Numbers</h3>
          <p className="text-4xl font-bold">{totalGSTNumbers}</p>
        </div>
        <div className="p-6 rounded-lg bg-gradient-to-r from-red-900 to-red-400 text-white shadow-lg">
          <h3 className="text-lg font-semibold">Active States</h3>
          <p className="text-4xl font-bold">{totalStates}</p>
        </div>
      </div>

      {/* Add Business Button */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-900 text-white py-2 px-4 rounded-lg mb-4 hover:bg-blue-600"
      >
        Add Business
      </button>

      {/* Filters */}
      <div className="bg-blue-700 p-4 mb-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">
          Filter Businesses
        </h2>
        <div className="grid grid-cols-6 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Object.keys(placeholderNames).map((key) => (
            <div key={key} className="flex flex-col">
              <label
                htmlFor={key}
                className="text-sm font-medium text-gray-100 mb-1"
              >
                {placeholderNames[key]}
              </label>
              <input
                type="text"
                id={key}
                name={key}
                value={filters[key]}
                onChange={handleFilterChange}
                placeholder={`Search by ${placeholderNames[key]}`}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring focus:ring-blue-400 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Business Table */}
      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Business Name</th>
              <th className="py-3 px-4 text-left">Registration Number</th>
              <th className="py-3 px-4 text-left">Contact Number</th>
              <th className="py-3 px-4 text-left">City</th>
              <th className="py-3 px-4 text-left">State</th>
              <th className="py-3 px-4 text-left">GST Number</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBusinesses.map((business) => (
              <tr
                key={business.registrationNumber}
                className="hover:bg-yellow-100 text-sm sm:text-base"
              >
                <td className="py-3 px-4">{business.businessName}</td>
                <td className="py-3 px-4">{business.registrationNumber}</td>
                <td className="py-3 px-4">{business.contactNumber}</td>
                <td className="py-3 px-4">{business.city}</td>
                <td className="py-3 px-4">{business.state}</td>
                <td className="py-3 px-4">{business.gstNumber}</td>
                <td className="py-3 px-4 flex space-x-2">
                  <button
                    onClick={() => handleEditBusiness(business)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <AiOutlineEdit size={20} />
                  </button>
                  <button
                    onClick={() =>
                      handleRemoveBusiness(business.registrationNumber)
                    }
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">
              {isEditMode ? "Edit Business" : "Add Business"}
            </h2>
            <form
              onSubmit={isEditMode ? handleUpdateBusiness : handleAddBusiness}
            >
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(placeholderNames).map((key) => (
                  <div key={key} className="flex flex-col">
                    <label htmlFor={key}>{placeholderNames[key]}</label>
                    <input
                      type="text"
                      id={key}
                      name={key}
                      value={newBusiness[key]}
                      onChange={handleInputChange}
                      className="border px-3 py-2 rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg mr-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`py-2 px-4 rounded-lg ${
                    isEditMode
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white`}
                >
                  {isEditMode ? "Update Business" : "Add Business"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDetails;
