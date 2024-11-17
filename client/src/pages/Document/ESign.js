import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function ESign() {
  const [document, setDocument] = useState(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [signatureType, setSignatureType] = useState("typed");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL;
  const { docId } = useParams();
  const navigate = useNavigate();

  // Fetch the document details when component mounts
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`${apiUrl}/esign/${docId}`);
        setDocument(response.data);
      } catch (err) {
        toast.error("Failed to load document.");
        console.error("Error fetching document:", err);
      }
    };

    fetchDocument();
  }, [docId, apiUrl]);

  const handleTypedSignature = (e) => {
    setTypedSignature(e.target.value);
  };

  // For signature canvas
  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext("2d");
    setSignatureDataUrl(canvasRef.current.toDataURL());
    ctx.closePath();
  };

  // Clear canvas
  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSignatureDataUrl(null);
  };

  // Handle signature submission
  const handleSubmitSignature = async (e) => {
    e.preventDefault();

    const signature =
      signatureType === "typed" ? typedSignature.trim() : signatureDataUrl;

    if (!signature) {
      toast.error("Please provide your signature.");
      return;
    }

    const payload = {
      signature: signature,
      signatureType: signatureType,
    };

    try {
      const response = await axios.post(
        `${apiUrl}/documents/${docId}/sign`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        toast.success(
          response.data.message || "Signature submitted successfully."
        );
        navigate("/");
      } else {
        toast.error(response.data.message || "Failed to upload signature.");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the signature.");
      console.error("Error submitting signature:", error);
    }
  };

  return (
    <div>
      {document ? (
        <div>
          <h2>Document Preview</h2>
          <iframe
            src={`${apiUrl}/documents/uploads/${docId}/pdf`}
            width="100%"
            height="600px"
            title="Document Preview"
            style={{ border: "1px solid #ddd" }}
          />
        </div>
      ) : (
        <p>Loading document...</p>
      )}

      <div style={{ marginTop: "30px" }}>
        <h3>Sign the Document</h3>
        <div>
          <label>
            <strong>Signature Type:</strong>
            <select
              value={signatureType}
              onChange={(e) => setSignatureType(e.target.value)}
              style={{ marginLeft: "10px" }}
            >
              <option value="typed">Typed</option>
              <option value="drawn">Drawn</option>
            </select>
          </label>
        </div>

        {signatureType === "typed" && (
          <div style={{ marginTop: "20px" }}>
            <label>
              <strong>Typed Signature:</strong>
              <input
                type="text"
                value={typedSignature}
                onChange={handleTypedSignature}
                placeholder="Enter your signature"
                style={{ marginLeft: "10px" }}
              />
            </label>
          </div>
        )}

        {/* Drawn Signature Canvas */}
        {signatureType === "drawn" && (
          <div style={{ marginTop: "20px" }}>
            <h4>Draw your Signature</h4>
            <canvas
              ref={canvasRef}
              width="500"
              height="200"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{
                border: "1px solid #000",
                cursor: "crosshair",
                marginBottom: "20px",
              }}
            />
            <button onClick={clearCanvas}>Clear</button>
          </div>
        )}

        <button
          style={{
            marginTop: "20px",
          }}
          className="btn btn-primary"
          onClick={handleSubmitSignature}
        >
          Submit Signature
        </button>
      </div>
    </div>
  );
}

export default ESign;
