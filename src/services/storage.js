import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads an image file to Firebase Storage
 * @param {File | Blob} file - The image file to upload
 * @returns {Promise<string>} The download URL of the uploaded image
 */
export const uploadImage = async (file) => {
  try {
    if (!file) throw new Error("No file provided");
    
    // Create a unique filename
    const filename = `issues/${Date.now()}_${file.name || 'image'}`;
    const storageRef = ref(storage, filename);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
