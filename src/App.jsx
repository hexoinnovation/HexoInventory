import { doc, setDoc } from "firebase/firestore"; // Firestore functions for adding data
import { useState } from "react";
import { FaLock, FaSignInAlt, FaUser } from "react-icons/fa";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import {
  auth,
  createUserWithEmailAndPassword,
  db,
  signInWithEmailAndPassword,
} from "./config/firebase";
import Shop from "./pages/Account";
import Attendence from "./pages/Attendence";
import BusinessDetails from "./pages/BusinessDetails";
import CustomerDetails from "./pages/CustomerDetails";
import Dashboard from "./pages/Dashboard";
import EmployeeDetails from "./pages/EmployeeDetails";
import Invoice from "./pages/Invoice";
import Purchase from "./pages/Purchase";
import Sales from "./pages/Sales";
import Order from "./pages/Settings";
import Stock from "./pages/Stock";
import View from "./pages/viewAllInvoice";

import Notifications from "./Components/Notifications"; // Example page component
import { AuthProvider } from "./authContext.jsx";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle sign-up logic
  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Add admin data to the "admins" collection in Firestore
      await setDoc(doc(db, "admins", user.email), {
        email: user.email,
        createdAt: new Date(),
      });

      alert("Account created successfully! You can now log in.");
      setIsSignup(false); // Switch to login form
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert(
          "This email is already registered. Please use a different email or log in."
        );
      } else if (error.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        console.error("Error during sign-up: ", error);
        alert("An error occurred. Please try again.");
      }
    }
  };

  // Handle login logic
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      setShowModal(false); // Hide modal after login
    } catch (error) {
      console.error("Error during login: ", error);
      alert("Invalid email or password. Please try again.");
    }
  };

  // Handle logout logic
  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowModal(true);
  };

  // Handle sidebar toggle
  const handleMenuClick = () => {
    setSidebarVisible((prevState) => !prevState);
  };

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {isAuthenticated && <Sidebar sidebarVisible={sidebarVisible} />}
          <div id="content" className={isAuthenticated ? "" : "blur-sm"}>
            {isAuthenticated && <Navbar handleMenuClick={handleMenuClick} />}
            <Routes>
              <Route path="/" element={!isAuthenticated ? "" : <Dashboard />} />
              <Route
                path="/dashboard"
                element={
                  isAuthenticated ? (
                    <Dashboard handleLogout={handleLogout} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/purchase"
                element={isAuthenticated ? <Purchase /> : <Navigate to="/" />}
              />
              <Route
                path="/invoice"
                element={isAuthenticated ? <Invoice /> : <Navigate to="/" />}
              />
              <Route
                path="/viewAllInvoice"
                element={isAuthenticated ? <View /> : <Navigate to="/" />}
              />
              <Route
                path="/CustomerDetails"
                element={
                  isAuthenticated ? <CustomerDetails /> : <Navigate to="/" />
                }
              />
              <Route
                path="/BusinessDetails"
                element={
                  isAuthenticated ? <BusinessDetails /> : <Navigate to="/" />
                }
              />
              <Route
                path="/Stock"
                element={isAuthenticated ? <Stock /> : <Navigate to="/" />}
              />
              <Route
                path="/sales"
                element={isAuthenticated ? <Sales /> : <Navigate to="/" />}
              />
              <Route
                path="/shop"
                element={isAuthenticated ? <Shop /> : <Navigate to="/" />}
              />
              <Route
                path="/order"
                element={isAuthenticated ? <Order /> : <Navigate to="/" />}
              />
              <Route
                path="/employee"
                element={
                  isAuthenticated ? <EmployeeDetails /> : <Navigate to="/" />
                }
              />
              <Route
                path="/attendence"
                element={isAuthenticated ? <Attendence /> : <Navigate to="/" />}
              />
              <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </div>
          <ToastContainer position="top-center" autoClose={3000} />
          {/* Modal for Login/Signup */}
          {!isAuthenticated && showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
              <div className="bg-white p-10 rounded-lg w-96 shadow-lg">
                <h2 className="text-3xl mb-6 text-center text-gray-800">
                  {isSignup ? "Admin Sign Up" : "Admin Login"}
                </h2>

                {/* Login or Signup Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    isSignup ? handleSignup() : handleLogin();
                  }}
                >
                  {/* Email Field */}
                  <div className="mb-6">
                    <div className="relative">
                      <FaUser className="absolute left-3 top-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 pl-10 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="mb-6">
                    <div className="relative">
                      <FaLock className="absolute left-3 top-4 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 pl-10 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-400 text-white p-3 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <FaSignInAlt />
                    <span>{isSignup ? "Sign Up" : "Login"}</span>
                  </button>
                </form>

                {/* Switch to Sign Up / Login */}
                <p className="text-sm mt-4 text-center text-gray-600">
                  {isSignup ? (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => setIsSignup(false)}
                        className="text-blue-500 hover:underline"
                      >
                        Login
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => setIsSignup(true)}
                        className="text-blue-500 hover:underline"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
