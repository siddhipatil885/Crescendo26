const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImage = async (file, issueId = "general", type = "image") => {
  try {
    if (!file) {
      throw new Error("Please select an image to upload.");
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Image upload failed. Please try again.");
    }

    const safeIssueId = issueId || "general";
    const safeType = type || "image";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", `issues/${safeIssueId}/${safeType}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.secure_url) {
      throw new Error(data?.error?.message || "Image upload failed. Please try again.");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(error?.message || "Image upload failed. Please try again.");
  }
};

export const uploadToCloudinary = (file, issueId, type) => {
  if (!issueId || !type) {
    throw new Error("uploadToCloudinary requires issueId and type");
  }

  return uploadImage(file, issueId, type);
};

export const uploadIssueImage = (issueId, file, imageType) => {
  if (!issueId || !imageType) {
    throw new Error("uploadIssueImage requires issueId and imageType");
  }

  return uploadImage(file, issueId, imageType);
};

/**
 * Get a resized thumbnail version of any Cloudinary URL.
 * No extra API call — just URL transformation.
 */
export const getThumbnailUrl = (url, width = 400, height = 300) => {
  if (!url) return null;
  return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill/`);
};
