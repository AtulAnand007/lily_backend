import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";


const storage = new CloudinaryStorage({
    cloudinary,
    params: async(req, file) => {
        const folderName = req.uploadType || "misc_uploads"
        return {
            folder: folderName,
            allowed_formats: ["jpg", "png", "jpeg"],
            transformation: [{ width: 500, height: 500, crop: "limit" }],
        };
    },

});

export const upload = multer({ storage });