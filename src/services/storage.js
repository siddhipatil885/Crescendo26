const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload any file to Cloudinary.
 * Returns the secure_url to store in Firestore.
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Cloudinary upload failed");

  const data = await res.json();
  return data.secure_url;
};

/**
 * Get a resized thumbnail version of any Cloudinary URL.
 * No extra API call — just URL transformation.
 */
export const getThumbnailUrl = (url, width = 400, height = 300) => {
  if (!url) return null;
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill/`);
};
