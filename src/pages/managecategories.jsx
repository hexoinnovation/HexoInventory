import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
// import { useAuth } from "../Authcontext";

const ManageCategories = (currentUser) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    image: "",
  });
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  // const { currentUser } = useAuth();

  if (!currentUser) {
    return <p>Loading...</p>;
  }

  const categoriesCollection = collection(
    db,
   
    "categories"
  );
 
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getDocs(categoriesCollection);
        setCategories(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      } catch (error) {
        console.error("Error fetching categories: ", error);
      }
    };

    fetchCategories();
  }, [currentUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCategory({ ...newCategory, image: event.target.result });
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async () => {
    try {
      const newDoc = await addDoc(categoriesCollection, newCategory);
      setCategories([...categories, { ...newCategory, id: newDoc.id }]);
      resetForm();
    } catch (error) {
      console.error("Error adding category: ", error);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const categoryDoc = doc(
        db,
        "users",
        currentUser.email,
        "categories",
        editCategoryId
      );
      await updateDoc(categoryDoc, newCategory);
      setCategories((prevCategories) =>
        prevCategories.map((category) =>
          category.id === editCategoryId
            ? { ...category, ...newCategory }
            : category
        )
      );
      resetForm();
    } catch (error) {
      console.error("Error updating category: ", error);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const categoryDoc = doc(db, "users", currentUser.email, "categories", id);
      await deleteDoc(categoryDoc);
      setCategories((prevCategories) =>
        prevCategories.filter((category) => category.id !== id)
      );
    } catch (error) {
      console.error("Error deleting category: ", error);
    }
  };

  const resetForm = () => {
    setNewCategory({
      name: "",
      description: "",
      image: "",
    });
    setEditCategoryId(null);
    setPreviewImage(null);
  };

  const totalCategories = categories.length;
  const categoriesWithImages = categories.filter(
    (category) => category.image
  ).length;
  const categoriesWithoutImages = totalCategories - categoriesWithImages;

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen w-full">
      <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
        Manage Categories
      </h1>

      {/* Info Boxes */}
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Total Categories</h2>
          <p className="text-3xl font-bold">{totalCategories}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Categories with Images</h2>
          <p className="text-3xl font-bold">{categoriesWithImages}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-700 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold">Categories without Images</h2>
          <p className="text-3xl font-bold">{categoriesWithoutImages}</p>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-[30%,70%] lg:grid-cols-[30%,70%] gap-8">
      {/* Category Form */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            {editCategoryId ? "Edit Category" : "Add Category"}
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Category Name"
              className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
            />
            <textarea
              placeholder="Description"
              className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 h-24"
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory({ ...newCategory, description: e.target.value })
              }
            ></textarea>
            <input
              type="file"
              accept="image/*"
              className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              onChange={handleImageUpload}
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="w-32 h-32 object-cover rounded mt-4"
              />
            )}
          </div>
          <div className="mt-4 flex justify-between">
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
              onClick={
                editCategoryId ? handleUpdateCategory : handleAddCategory
              }
            >
              {editCategoryId ? "Update Category" : "Add Category"}
            </button>
            <button
              className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-200"
              onClick={resetForm}
            >
              Clear Form
            </button>
          </div>
        </div>

        {/* Category List */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">
            Category List
          </h2>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100 text-blue-700">
                <th className="border p-3">Image</th>
                <th className="border p-3">Name</th>
                <th className="border p-3">Description</th>
                <th className="border p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    No categories available.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 transition duration-200"
                  >
                    <td className="border p-3">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="border p-3">{category.name}</td>
                    <td className="border p-3">{category.description}</td>
                    <td className="border p-3 flex justify-around">
                      <FontAwesomeIcon
                        icon={faEdit}
                        className="text-yellow-500 cursor-pointer hover:scale-110 transition-transform duration-200"
                        onClick={() => {
                          setEditCategoryId(category.id);
                          setNewCategory(category);
                          setPreviewImage(category.image);
                        }}
                      />
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="text-red-500 cursor-pointer hover:scale-110 transition-transform duration-200"
                        onClick={() => handleDeleteCategory(category.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;