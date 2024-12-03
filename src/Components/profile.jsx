import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../config/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { updateEmail } from "firebase/auth";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

// Import Material Icons
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import HomeIcon from "@mui/icons-material/Home";
import WcIcon from "@mui/icons-material/Wc";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../Authcontext";
const MyProfile = () => {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    address: "",
    dob: "",
    gender: "",
    role: "User",
    profilePicture: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [emailEdit, setEmailEdit] = useState("");
  const [uploading, setUploading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const docRef = doc(db, "admins", user.email, "user_profiles", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
        setEmailEdit(user.email);
      } else {
        console.log("No user profile found! Creating a new profile...");
        await setDoc(docRef, profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };
  const handleEmailChange = async () => {
    try {
      if (!emailEdit || emailEdit === user.email) {
        alert(
          "Please provide a new email address that is different from the current one."
        );
        return;
      }

      // Prompt the user for re-authentication
      const currentPassword = prompt(
        "Please enter your current password to confirm:"
      );
      if (!currentPassword) {
        alert("Password is required for re-authentication.");
        return;
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      // Reauthenticate the user
      await reauthenticateWithCredential(user, credential);

      // Update the email in Firebase Authentication
      await updateEmail(user, emailEdit);

      // Update the email in Firestore
      const userDocRef = doc(db, "user_profiles", user.uid); // Adjust the collection name if needed
      await updateDoc(userDocRef, { user: emailEdit });

      alert("Email updated successfully in Authentication and Database!");
    } catch (error) {
      console.error("Error updating email:", error);

      let errorMessage = "Error updating email. Please try again.";
      if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "This operation requires recent authentication. Please log in again.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "The provided email is already in use by another account.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "The provided email is invalid.";
      }

      alert(errorMessage);
    }
  };
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert("Please select an image.");
      return;
    }

    const previewURL = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, profilePicture: previewURL }));

    try {
      setUploading(true);
      const storageRef = ref(storage, `profileImages/${user.uid}/${file.name}`);
      const snapshot = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docRef = doc(db, "user_profiles", user.uid);
      await updateDoc(docRef, { profilePicture: downloadURL });

      setProfile((prev) => ({ ...prev, profilePicture: downloadURL }));
      alert("Profile image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("An error occurred during the upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const docRef = doc(db, "admins", user.email, "user_profiles", user.uid);
      await updateDoc(docRef, profile);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-9 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 shadow-lg rounded-lg">
      <h2 className="text-4xl font-bold text-gray-700 mb-6 text-center">
        My Profile
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <img
              src={profile.profilePicture || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-40 h-40 rounded-full border-4 border-gray-600 shadow-lg"
            />
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-gray-600 text-white rounded-full p-2 cursor-pointer hover:bg-gray-500">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <EditIcon />
              </label>
            )}
          </div>
          {uploading && <p className="text-gray-500">Uploading...</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <PersonIcon /> Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full px-4 py-2 border rounded-lg ${
                  isEditing ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <EmailIcon /> Email
              </label>
              <input
                type="email"
                value={emailEdit}
                onChange={(e) => setEmailEdit(e.target.value)}
                disabled={!isEditing}
                className={`mt-1 block w-full px-4 py-2 border rounded-lg ${
                  isEditing ? "bg-white" : "bg-gray-100"
                }`}
              />
              {isEditing && (
                <button
                  onClick={handleEmailChange}
                  className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Update Email
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <PhoneIcon /> Phone
              </label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full px-4 py-2 border rounded-lg ${
                  isEditing ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <CalendarTodayIcon /> Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={profile.dob}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full px-4 py-2 border rounded-lg ${
                  isEditing ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <HomeIcon /> Address
              </label>
              <textarea
                name="address"
                value={profile.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full px-4 py-2 border rounded-lg ${
                  isEditing ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <WcIcon /> Gender
              </label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full px-4 py-2 border rounded-lg ${
                  isEditing ? "bg-white" : "bg-gray-100"
                }`}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;