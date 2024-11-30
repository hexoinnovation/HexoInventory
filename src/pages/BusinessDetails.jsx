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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { auth, db } from "../config/firebase"; // Replace with your Firebase configuration path

const BusinessDetails = () => {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // For Edit Modal
  const [newBusiness, setNewBusiness] = useState({
    businessName: "",
    registrationNumber: "",
    contactNumber: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    gstNumber: "",
    aadhaar: "",
    panno: "",
    website: "",
    email: "",
  });
  const [selectedBusiness, setSelectedBusiness] = useState(null); // Store selected business for editing
  const [businesses, setBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleAddBusiness = async (e) => {
    e.preventDefault();
    const {
      businessName,
      registrationNumber,
      contactNumber,
      address,
      city,
      state,
      zip,
      gstNumber,
      aadhaar,
      panno,
      website,
      email,
    } = newBusiness;

    if (
      !businessName ||
      !registrationNumber ||
      !contactNumber ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !gstNumber ||
      !aadhaar ||
      !panno ||
      !website ||
      !email
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const businessRef = collection(userDocRef, "Businesses");
      await setDoc(doc(businessRef, registrationNumber), {
        ...newBusiness, // Store the entire business object
      });

      setBusinesses((prev) => [...prev, { ...newBusiness }]);
      alert("Business added successfully!");
      setNewBusiness({
        businessName: "",
        registrationNumber: "",
        contactNumber: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        gstNumber: "",
        aadhaar: "",
        panno: "",
        website: "",
        email: "",
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding business: ", error);
    }
  };

  const handleRemoveBusiness = async (registrationNumber) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'User Not Authenticated',
        text: 'Please log in to delete a business.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
  
    // Confirm deletion with SweetAlert2
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won’t be able to undo this action!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });
  
    if (!result.isConfirmed) return; // Exit if the user cancels
  
    try {
      const businessDoc = doc(
        db,
        "admins",
        user.email,
        "Businesses",
        registrationNumber
      );
  
      // Delete business document from Firestore
      await deleteDoc(businessDoc);
  
      // Update the businesses state
      setBusinesses((prevBusinesses) =>
        prevBusinesses.filter(
          (business) => business.registrationNumber !== registrationNumber
        )
      );
  
      // Success SweetAlert
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Business has been deleted successfully.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#3085d6',
      });
    } catch (error) {
      console.error("Error deleting business: ", error.message);
  
      // Error SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to delete business. Please try again.',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#d33',
      });
    }
  };

  const handleEditBusiness = (business) => {
    setSelectedBusiness(business); // Set the selected business for editing
    setNewBusiness(business); // Pre-fill the form with the business data
    setShowEditModal(true); // Show the edit modal
  };

  const handleUpdateBusiness = async (e) => {
    e.preventDefault();
    const {
      businessName,
      registrationNumber,
      contactNumber,
      address,
      city,
      state,
      zip,
      gstNumber,
      aadhaar,
      panno,
      website,
      email,
    } = newBusiness;

    if (
      !businessName ||
      !registrationNumber ||
      !contactNumber ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !gstNumber ||
      !aadhaar ||
      !panno ||
      !website ||
      !email
    ) {
      return alert("Please fill all the fields.");
    }

    try {
      const userDocRef = doc(db, "admins", user.email);
      const businessRef = collection(userDocRef, "Businesses");
      const businessDocRef = doc(businessRef, registrationNumber);

      await updateDoc(businessDocRef, {
        ...newBusiness, // Update the business data
      });

      setBusinesses((prev) =>
        prev.map((business) =>
          business.registrationNumber === registrationNumber
            ? { ...newBusiness }
            : business
        )
      );

      alert("Business updated successfully!");
      setNewBusiness({
        businessName: "",
        registrationNumber: "",
        contactNumber: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        gstNumber: "",
        aadhaar: "",
        panno: "",
        website: "",
        email: "",
      });
      setShowEditModal(false); // Close the edit modal
    } catch (error) {
      console.error("Error updating business: ", error);
      alert("Failed to update business. Please try again.");
    }
  };

  const placeholderNames = {
    businessName: "Business Name",
    registrationNumber: "Registration Number",
    contactNumber: "Contact Number",
    address: "Address",
    city: "City",
    state: "State",
    zip: "Zip Code",
    gstNumber: "GST Number",
    aadhaar: "Aadhaar No",
    panno: "PAN No",
    website: "Website",
    email: "Email",
  };

  const filteredBusinesses = businesses.filter(
    (business) =>
      business.businessName &&
      business.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBusinesses = filteredBusinesses.length;

  return (
    <div className="container mx-auto p-6 mt-5 bg-gradient-to-r from-purple-50 via-pink-100 to-yellow-100 rounded-lg shadow-xl">
      <h1 className="text-5xl font-extrabold text-pink-700 mb-6 flex items-center">
        Business Details
        <FontAwesomeIcon icon={faBriefcase} className="animate-wiggle ml-4 " />
      </h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg mb-4 transition hover:bg-blue-600"
      >
        Add Business
      </button>
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-6 mb-6">
      <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300">
        <h3 className="text-xl font-semibold text-indigo-600">
          Total Businesses
        </h3>
        <p className="text-4xl font-bold text-yellow-500">{totalBusinesses}</p>
      </div>
</div>
      <div className="w-full mt-5">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Business Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Contact Number</th>
              {/* <th className="py-3 px-4 text-left">Address</th> */}
              <th className="py-3 px-4 text-left">GST Number</th>
              <th className="py-3 px-4 text-left">Aadhaar No</th>
              <th className="py-3 px-4 text-left">PAN No</th>
              <th className="py-3 px-4 text-left">Website</th>
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
                <td className="py-3 px-4">{business.email}</td>
                <td className="py-3 px-4">{business.contactNumber}</td>
                {/* <td className="py-3 px-4">{business.address}</td> */}
                <td className="py-3 px-4">{business.gstNumber}</td>
                <td className="py-3 px-4">{business.aadhaar}</td>
                <td className="py-3 px-4">{business.panno}</td>
                <td className="py-3 px-4">{business.website}</td>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Edit Business</h2>
            <form onSubmit={handleUpdateBusiness}>
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
              <button
                type="submit"
                className="mt-4 bg-green-500 text-white py-2 px-6 rounded-lg"
              >
                Update Business
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

      {/* Add Business Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Add Business</h2>
            <form onSubmit={handleAddBusiness}>
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
              <button
                type="submit"
                className="mt-4 bg-green-500 text-white py-2 px-6 rounded-lg"
              >
                Add Business
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

export default BusinessDetails;
