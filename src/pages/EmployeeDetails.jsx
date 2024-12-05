import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, query, where, getDocs ,doc,updateDoc,deleteDoc} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { storage } from "../config/firebase"; // Import Firebase storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Swal from 'sweetalert2';

import Notiflix from 'notiflix';
// Firebase setup (replace with your Firebase config)
const db = getFirestore();
const auth = getAuth();

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    photo: null,
    dob: "",
    gender: "",
    contact: "",
    email: "",
    role:"",
    address: "",
    state: "",
    country: "",
  });
  const [user, setUser] = useState(null);
    // Fetch user and employee data
    useEffect(() => {
      const fetchUser = async () => {
        const currentUser = auth.currentUser;
        setUser(currentUser);
  
        if (currentUser) {
          const userDocRef = collection(db, 'admins', currentUser.email, 'Empdetails');
          const q = query(userDocRef);
          const querySnapshot = await getDocs(q);
          const fetchedEmployees = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEmployees(fetchedEmployees);
        }
      };
  
      fetchUser();
    }, []);
  
    // Handle form input change
    const handleInputChange = (e) => {
      const { name, value, type, files } = e.target;
      if (type === 'file') {
        const file = files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewEmployee((prev) => ({ ...prev, [name]: reader.result }));
        };
        reader.readAsDataURL(file); // Read file as Base64
      } else {
        setNewEmployee((prev) => ({ ...prev, [name]: value }));
      }
    };
  
    const handleFormSubmit = async (e) => {
      e.preventDefault();
    
      if (!user) {
        Swal.fire({
          title: 'Error!',
          text: 'Please log in to add or update employee details.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
        return;
      }
    
      try {
        let photoURL = '';
    
        // Check if there is a file uploaded
        if (newEmployee.photo) {
          photoURL = newEmployee.photo; // This is the base64 string of the file
        }
    
        const userDocRef = collection(db, 'admins', user.email, 'Empdetails');
        const employeeData = {
          ...newEmployee,
          photo: photoURL, // Store the base64 string in Firestore
        };
    
        if (newEmployee.id) {
          // Update existing employee
          const employeeDocRef = doc(userDocRef, newEmployee.id);
          await setDoc(employeeDocRef, employeeData);
    
          // Update the employee in the UI
          setEmployees((prev) =>
            prev.map((emp) => (emp.id === newEmployee.id ? { ...emp, ...employeeData } : emp))
          );
    
          // Show success alert
          Swal.fire({
            title: 'Updated!',
            text: 'Employee updated successfully!',
            icon: 'success',
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
          // Add new employee
          const newDocRef = await addDoc(userDocRef, employeeData);
    
          // Update the employee list in the UI
          setEmployees((prev) => [...prev, { id: newDocRef.id, ...employeeData }]);
    
          // Show success alert
          Swal.fire({
            title: 'Added!',
            text: 'Employee added successfully!',
            icon: 'success',
            showConfirmButton: false,
            timer: 2000,
          });
        }
    
        // Close modal and reset form
        setIsModalOpen(false);
        setNewEmployee({
          name: '',
          photo: null,
          dob: '',
          gender: '',
          contact: '',
          email: '',
          role:'',
          address: '',
          state: '',
          country: '',
        });
      } catch (error) {
        console.error('Error adding/updating employee:', error);
    
        // Show error alert
        Swal.fire({
          title: 'Error!',
          text: 'Failed to add/update employee. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    };
    
    const handleView = (employeeId) => {
      const employee = employees.find(emp => emp.id === employeeId);
      setSelectedEmployee(employee);
      setIsDrawerOpen(true);
    };
    
    const handleEdit = (id) => {
      // Logic to handle edit action
      alert(`Edit employee with id: ${id}`);
    };
    


    const handleDelete = async (employeeId) => {
      if (!user) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Please log in to delete employee details.',
        });
        return;
      }
    
      // SweetAlert2 confirmation dialog
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
      });
    
      if (result.isConfirmed) {
        try {
          const userDocRef = collection(db, 'admins', user.email, 'Empdetails');
          const employeeDocRef = doc(userDocRef, employeeId);
    
          // Delete the document from Firestore
          await deleteDoc(employeeDocRef);
    
          // Update the UI
          setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    
          // Show success message
          Swal.fire({
            title: 'Deleted!',
            text: 'The employee has been deleted.',
            icon: 'success',
            showConfirmButton: false,
            timer: 2000,
          });
        } catch (error) {
          console.error('Error deleting employee:', error);
          Swal.fire({
            icon: 'error',
            title: 'Failed!',
            text: 'Failed to delete employee. Please try again.',
          });
        }
      }
    };
    
    // Function to delete employee from Firestore
    const deleteEmployeeFromFirestore = async (id) => {
      try {
        const userDocRef = collection(db, "admins", user.email, "Empdetails");
        await deleteDoc(doc(userDocRef, id)); // Delete employee document by ID
        setEmployees((prev) => prev.filter((employee) => employee.id !== id)); // Update UI
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee.");
      }
    };
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const handleSave = async (e) => {
      e.preventDefault(); // Prevent default form submission behavior
    
      if (!user) {
        Notiflix.Notify.warning('Please log in to update employee details.', {
          timeout: 4000,
          position: 'right-bottom',
          cssAnimationStyle: 'zoom',
        });
        return;
      }
    
      try {
        let photoURL = '';
    
        // Check if there is a photo uploaded
        if (selectedEmployee.photo) {
          photoURL = selectedEmployee.photo; // Use the photo URL or base64 string
        }
    
        const userDocRef = collection(db, 'admins', user.email, 'Empdetails');
    
        if (selectedEmployee.id) {
          // If the employee already exists, update the existing document
          const employeeDocRef = doc(userDocRef, selectedEmployee.id);
          await updateDoc(employeeDocRef, {
            ...selectedEmployee,
            photo: photoURL,
          });
    
          // Update the employee list in the UI
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === selectedEmployee.id
                ? { ...emp, ...selectedEmployee, photo: photoURL }
                : emp
            )
          );
    
          Notiflix.Notify.success('Employee details updated successfully!', {
            timeout: 3000,
            position: 'right-bottom',
            cssAnimationStyle: 'fade',
          });
        } else {
          Notiflix.Notify.failure('Employee ID is missing. Cannot update.', {
            timeout: 3000,
            position: 'right-bottom',
            cssAnimationStyle: 'zoom',
          });
        }
    
        // Close drawer and reset selected employee
        setIsDrawerOpen(false);
        setSelectedEmployee(null);
      } catch (error) {
        console.error('Error updating employee details:', error);
        Notiflix.Notify.failure('Failed to update employee details. Please try again.', {
          timeout: 4000,
          position: 'right-bottom',
          cssAnimationStyle: 'zoom',
        });
      }
    };
   
    const handleCloseDrawer = () => {
      setIsDrawerOpen(false);
    };
    const handleChange = (e, field) => {
      setSelectedEmployee(prevState => ({
        ...prevState,
        [field]: e.target.value
      }));
    };  
    const handlePhotoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          // Update the selectedEmployee object with the new photo URL
          handleChange({ target: { value: reader.result } }, 'photo');
        };
        reader.readAsDataURL(file);
      }
    };
    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
    };
  
    const filteredEmployees = employees.filter((employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  return (
    <div className="container mx-auto p-6">
    
  <div className="flex justify-between items-center mb-8">
    {/* Employee Management Title (Aligned to the left) */}
    <h1 className="text-4xl font-extrabold text-left text-purple-600">
      Employee Management System
    </h1>
  </div>
  <div className="container mx-auto p-6 ">
  <div className="flex items-center mb-2 ">
    {/* Total Employees Section */}
    <div className="bg-indigo-100 p-6 rounded-lg shadow-lg text-center border-2 border-indigo-300 w-80 transform transition duration-500 ease-in-out hover:scale-105">
    <h3 className="text-xl font-semibold text-indigo-600">Total Employees</h3>
    <p className="text-4xl font-bold text-indigo-500">{employees.length}</p>
  </div>
    <button
      onClick={() => setIsModalOpen(true)}
      className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white px-6 py-3 rounded-lg shadow-md hover:from-teal-600 hover:to-blue-600 ml-6"
    >
      Add New Employee
    </button>
  </div>
</div>

  {/* Search Bar (Aligned to the side, next to Total Employees) */}
  <div className="relative w-full max-w-xs ml-0">
    <input
      type="text"
      placeholder="Search Employee..."
      className="w-full py-3 pl-10 ml-8 pr-4 border-2 border-indigo-300 rounded-lg shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 ease-in-out"
      value={searchTerm}
      onChange={handleSearchChange}
    />
    {/* Search Icon */}
    <span className="absolute left-3 top-3 text-indigo-500 ml-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        className="w-6 h-6 text-indigo-500"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 19l5-5m0 0a7 7 0 1 0-1 1 7 7 0 0 0 1-1zm0 0l4 4"
        />
      </svg>
    </span>
  </div>



{/* Modal */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50 overflow-y-auto">
    <div className="bg-white p-6 rounded-xl shadow-lg w-11/12 max-w-md max-h-[80vh] overflow-y-auto mt-16">
      {/* Header */} 
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-purple-600">Add Employee</h2>
        <button
          onClick={() => setIsModalOpen(false)}
          className="text-red-500 hover:text-indigo-500 text-4xl font-bold"
        >
          &times;
        </button>
      </div>
      {/* Form */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={newEmployee.name}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Photo</label>
          <input
            type="file"
            name="photo"
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            accept="image/*"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={newEmployee.dob}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700  ">Gender</label>
          <div className="flex gap-6 ">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="Male"
                onChange={handleInputChange}
                className="mr-2"
              />
              Male
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value="Female"
                onChange={handleInputChange}
                className="mr-2 "
              />
              Female
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Contact</label>
          <input
            type="text"
            name="contact"
            value={newEmployee.contact}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={newEmployee.email}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            name="address"
            value={newEmployee.address}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            rows="2"
            required
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            value={newEmployee.role}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            required
          >
            <option value="">Select Role</option>
            <option value="Permanent">Permanent</option>
            <option value="Temporary">Temporary</option>
            <option value="Dailywages">Daily Wages</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input
            type="text"
            name="state"
            value={newEmployee.state}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            required
          />
        </div>
        
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <select
            name="country"
            value={newEmployee.country}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 hover:shadow-lg transition duration-300 ease-in-out"
            required
          >
            <option value="">Select Country</option>
            <option value="India">India</option>
            <option value="China">China</option>
            <option value="USA">USA</option>
            <option value="Germany">Germany</option>
            <option value="Japan">Japan</option>
          </select>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition duration-300"
          >
            Add Employee
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Employee Table */}
      <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200">
        <table className="min-w-full table-auto mt-4">
          <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
 
    <tr>
      <th className="px-20 py-2 text-left">Name</th>
     
      <th className="px-4 py-2 text-left">Date of Birth</th>
      <th className="px-4 py-2 text-left">Contact</th>
      <th className="px-4 py-2 text-left">Email</th>
      <th className="px-4 py-2 text-left">Role</th>
      <th className="px-4 py-2 text-left">Address</th>
      <th className="px-4 py-2 text-left">State</th>
      <th className="px-4 py-2 text-left">Country</th>
      <th className="px-4 py-2 text-left">Actions</th>
    </tr>
  </thead>
  <tbody>
  {filteredEmployees.length === 0 ? (
    <tr>
      <td colSpan="8" className="text-center py-4 text-red-500 font-semibold">
        No Employee Found
      </td>
    </tr>
  ) : (
    filteredEmployees.map((employee) => (
      <tr key={employee.id} className="border-b">
        <td className="px-4 py-2">
          <div className="flex items-center gap-5">
            <img
              src={employee.photo}
              alt="Employee"
              className="rounded-full w-15 h-14"
            />
            <span>{employee.name}</span>
          </div>
        </td>
      <td className="px-4 py-2">{employee.dob}</td>
      <td className="px-4 py-2">{employee.contact}</td>
      <td className="px-4 py-2">{employee.email}</td>
      <td className="px-4 py-2">{employee.role}</td>
      <td className="px-4 py-2">{employee.address}</td>
     
      <td className="px-4 py-2">{employee.state}</td>
      <td className="px-4 py-2">{employee.country}</td>
      <td className="px-3 py-2">
  <div className="flex space-x-1"> {/* Use flex to align the buttons in the same row */}
    <button
      className="text-blue-500 hover:text-blue-700 p-2 rounded-full transition duration-200"
      onClick={() => handleView(employee.id)}
    >
      <i className="fas fa-eye"></i> {/* Eye Icon */}
    </button>
    <button
      className="text-red-500 hover:text-red-700 p-2 rounded-full transition duration-200"
      onClick={() => handleDelete(employee.id)}
    >
      <i className="fas fa-trash"></i> {/* Trash Icon */}
    </button>
  </div>
</td>
    </tr>
     ))
  )}
</tbody>

</table>
{isDrawerOpen && (
  <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-end z-50">
    <div
      className={`bg-white w-96 h-full p-6 overflow-y-auto shadow-lg fixed top-0 right-0 z-50 transform transition-transform duration-500 ease-in-out`}
      style={{ transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
    >
      {/* Drawer Header with Close Button */}
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h2 className="text-xl font-semibold text-purple-600">Employee Details</h2>
        <button
          onClick={handleCloseDrawer}
          className="text-indigo-500 hover:text-red-700 text-3xl focus:outline-none absolute top-0 right-0 mt-20 mr-3"
          aria-label="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Employee Details Form */}
      <div className="mt-4 space-y-4">
        {/* Profile Image */}
        <div className="flex flex-col items-center space-y-3">
  {/* Editable Profile Image */}
  <label className="relative cursor-pointer group">
    <img
      src={selectedEmployee?.photo || 'https://via.placeholder.com/150'}
      alt="Employee"
      className="rounded-full w-32 h-34 object-cover border-2 border-indigo-500 group-hover:opacity-70 transition"
    />
    {/* Upload Icon */}
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-gray-900 bg-opacity-50 rounded-full">
      <i className="fas fa-camera text-white text-xl"></i>
    </div>
    {/* Hidden File Input */}
    <input
      type="file"
      accept="image/*"
      onChange={handlePhotoUpload}
      className="hidden"
    />
  </label>
</div>
        {/* Editable Fields */}
        <div>
          <label className="block font-semibold text-purple-700">Name:</label>
          <input
            type="text"
            value={selectedEmployee?.name || ''}
            onChange={(e) => handleChange(e, 'name')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block font-semibold text-purple-700">DOB:</label>
          <input
            type="date"
            value={selectedEmployee?.dob || ''}
            onChange={(e) => handleChange(e, 'dob')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block font-semibold text-purple-700">Contact:</label>
          <input
            type="tel"
            value={selectedEmployee?.contact || ''}
            onChange={(e) => handleChange(e, 'contact')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block font-semibold text-purple-700">Email:</label>
          <input
            type="email"
            value={selectedEmployee?.email || ''}
            onChange={(e) => handleChange(e, 'email')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block font-semibold text-purple-700">Role:</label>
          <input
            type="text"
            value={selectedEmployee?.role || ''}
            onChange={(e) => handleChange(e, 'role')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block font-semibold text-purple-700">Address:</label>
          <input
            type="text"
            value={selectedEmployee?.address || ''}
            onChange={(e) => handleChange(e, 'address')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block font-semibold text-purple-700">State:</label>
          <input
            type="text"
            value={selectedEmployee?.state || ''}
            onChange={(e) => handleChange(e, 'state')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div>
          <label className="block font-semibold text-purple-700">Country:</label>
          <input
            type="text"
            value={selectedEmployee?.country || ''}
            onChange={(e) => handleChange(e, 'country')}
            className="border-2 border-indigo-500 p-3 w-full rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition duration-300"
          >
            Save 
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default App;
