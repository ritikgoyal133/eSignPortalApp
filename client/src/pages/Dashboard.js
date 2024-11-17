import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!apiUrl) {
      console.error("API URL is not defined. Check your .env file.");
      setLoading(false);
      return;
    }

    axios
      .get(`${apiUrl}/documents`)
      .then((response) => {
        setDocuments(response.data);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching documents:", error);
        setError("Unable to fetch documents. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [apiUrl]);

  const handlePreviewClick = async (docId) => {
    try {
      const response = await axios.get(`${apiUrl}/documents/${docId}/preview`);

      if (response.data.previewUrl) {
        const fullPreviewUrl = `${apiUrl}${response.data.previewUrl}`;
        window.open(fullPreviewUrl, "_blank");
      } else {
        console.error("No preview URL found in response.");
        toast.error("Preview URL not found. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
      toast.error(
        "An error occurred while fetching the preview. Please try again."
      );
    }
  };

  if (loading) {
    return <div className="text-center">Loading documents...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">{error}</div>;
  }

  return (
    <div className="container">
      <h1>Document List</h1>

      <table className="table">
        <thead>
          <tr>
            <th>S.No.</th>
            <th>Date</th>
            <th>Document</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center">
                No documents available
              </td>
            </tr>
          ) : (
            documents.map((doc, index) => (
              <tr key={doc.docId}>
                <td>{index + 1}</td>
                <td>
                  {new Intl.DateTimeFormat("en-US").format(
                    new Date(doc.createdAt)
                  )}
                </td>
                <td>{doc.name}</td>
                <td>{doc.status.toUpperCase()}</td>
                <td>
                  {doc.status === "signed" ? (
                    <button
                      onClick={() => handlePreviewClick(doc.docId)}
                      className="btn btn-info"
                      aria-label={`Preview document ${doc.name}`}
                    >
                      Preview
                    </button>
                  ) : (
                    <Link
                      to={`/esign/${doc.docId}`}
                      className="btn btn-secondary"
                      aria-label={`E-Sign document ${doc.name}`}
                    >
                      E-Sign
                    </Link>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
