import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { AiOutlineDownload, AiOutlineEye } from "react-icons/ai";
import { MdOutlineAddCircle } from "react-icons/md";
import {
  doc,
  setDoc,
  collection,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { auth } from "../config/firebase"; // Make sure you have firebase authentication set up
import { useAuthState } from "react-firebase-hooks/auth"; // To get current user
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const Suppliers = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [user] = useAuthState(auth);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContact((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission to add new contact
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setContacts((prev) => [...prev, { ...newContact, id: prev.length + 1 }]);
    setShowModal(false);
    setNewContact({ name: "", phone: "", address: "" });
  };

  // Handle removing contact from the list
  const handleRemoveContact = (contactId) => {
    setContacts(contacts.filter((contact) => contact.id !== contactId));
    setShowPopup(false);
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      {/* Search and Button Section */}
      <div className="flex justify-between mb-4">
        {/* Search Bar */}
        <div className="relative w-1/3 flex items-center">
          <label htmlFor="table-search" className="sr-only">
            Search
          </label>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="w-4 h-4 text-gray-600" />
          </div>
          <input
            type="text"
            id="table-search"
            className="block w-full pl-10 pr-4 py-2 text-sm text-black border border-gray-500 rounded-lg bg-gray-50"
            placeholder="Search for contacts"
          />
        </div>

        {/* Create Contact and Download Button */}
        <div className="flex flex-col gap-2">
          <button
            className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
            onClick={() => setShowModal(true)}
          >
            <div className="flex gap-1">
              <span className=" text-2xl ">
                <MdOutlineAddCircle />
              </span>
              <span className="text-base">Create</span>
            </div>
          </button>
          <button className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
            <AiOutlineDownload className="w-5 h-5 inline mr-2" /> SVG
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-white">
          <thead className="text-xs text-black uppercase bg-gray-300">
            <tr>
              <th scope="col" className="px-6 py-3">
                ID
              </th>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Phone
              </th>
              <th scope="col" className="px-6 py-3">
                Address
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-200 text-black">
            {contacts.map((contact) => (
              <tr key={contact.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{contact.id}</td>
                <td className="px-6 py-4">{contact.name}</td>
                <td className="px-6 py-4">{contact.phone}</td>
                <td className="px-6 py-4">{contact.address}</td>
                <td className="px-6 py-4">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => {
                      setShowPopup(true);
                      setSelectedContact(contact);
                    }}
                  >
                    <AiOutlineEye className="inline mr-1" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding Contact */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 ">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs x-small:ml-12  sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl">
            <h2 className="text-2xl font-semibold mb-4"> Create Suppliers</h2>
            <form onSubmit={handleFormSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                className="w-full mb-4 p-2 border rounded"
                value={newContact.name}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                className="w-full mb-4 p-2 border rounded"
                value={newContact.phone}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                className="w-full mb-4 p-2 border rounded"
                value={newContact.address}
                onChange={handleInputChange}
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 mr-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup for Viewing Contact Details */}
      {showPopup && selectedContact && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 ">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs x-small:ml-12  sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl">
            <h2 className="text-2xl font-semibold mb-4">Contact Details</h2>
            <p>
              <strong>ID:</strong> {selectedContact.id}
            </p>
            <p>
              <strong>Name:</strong> {selectedContact.name}
            </p>
            <p>
              <strong>Phone:</strong> {selectedContact.phone}
            </p>
            <p>
              <strong>Address:</strong> {selectedContact.address}
            </p>
            <div className="flex justify-end mt-4 gap-2">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleRemoveContact(selectedContact.id)}
              >
                Remove
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
