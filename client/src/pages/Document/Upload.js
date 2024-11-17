import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const formatFileSize = (sizeInBytes) => {
  return (sizeInBytes / (1024 * 1024)).toFixed(1) + "MB";
};

const Upload = () => {
  const [file, setFile] = useState(null);
  const [isFileValid, setIsFileValid] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileError("");

    if (selectedFile) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setFileError("Invalid file type! Only PDF or DOCX files are allowed.");
        setIsFileValid(false);
        toast.error("Invalid file type! Only PDF or DOCX files are allowed.");
        return;
      }

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        const maxSizeFormatted = formatFileSize(MAX_FILE_SIZE);
        setFileError(`File size should not exceed ${maxSizeFormatted}.`);
        setIsFileValid(false);
        toast.error(`File size should not exceed ${maxSizeFormatted}.`);
        return;
      }

      setIsFileValid(true);
    }
  };

  const handleSubmit = async () => {
    if (isFileValid && file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("document", file);

      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.post(
          `${apiUrl}/documents/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const { docId } = response.data.document;

        if (docId) {
          toast.success("File uploaded successfully!");
          setFile(null); // Clear the file input after successful upload
          navigate(`/esign/${docId}`);
        } else {
          toast.error(
            "Error: Document upload failed. No document ID returned."
          );
        }
      } catch (error) {
        console.error("Error uploading file:", error);

        if (error.response && error.response.data) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Error uploading document.");
        }
      } finally {
        setIsUploading(false);
      }
    } else {
      toast.error("Please select a valid file.");
    }
  };

  return (
    <div className="container">
      <h1>Upload Document</h1>
      <div className="form-group">
        <label htmlFor="fileInput">Choose PDF or DOCX file</label>
        <input
          type="file"
          id="fileInput"
          className="form-control"
          name="document"
          onChange={handleFileChange}
        />
        {file && <p>Selected File: {file.name}</p>}
        {fileError && <p className="text-danger">{fileError}</p>}
      </div>

      <button
        className="btn btn-primary my-3"
        onClick={handleSubmit}
        disabled={!isFileValid || !file || isUploading}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>

      <Link to="/dashboard" className="btn btn-secondary my-3">
        Go Back to Dashboard
      </Link>
    </div>
  );
};

export default Upload;
