import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Uploads an image file to Firebase Storage
 * @param {File | Blob} file - The image file to upload
 * @returns {Promise<string>} The download URL of the uploaded image
 */
export const uploadImage = async (file) => {
  try {
    if (!file) throw new Error("No file provided");
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    let sanitizedName = (file.name || 'image')
      .split(/[/\\]/).pop()
      .replace(/[^a-zA-Z0-9.\-_]/g, '')
      .substring(0, 100);
    if (!sanitizedName) sanitizedName = 'image';
    
    // Create a unique filename
    const filename = `issues/${Date.now()}_${sanitizedName}`;
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
