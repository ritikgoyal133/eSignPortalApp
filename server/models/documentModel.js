import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Function to generate custom docId
const generateDocId = () => `DOC-${uuidv4()}`;

// Define the document schema
const documentSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      required: true,
      unique: true,
      default: generateDocId,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Document name is required"],
    },
    signature: {
      type: String,
    },
    documentPath: {
      type: String,
      required: [true, "Document path is required"],
    },
    signatureType: {
      type: String,
      enum: ["typed", "drawn"],
      description: "Defines the type of signature: typed or drawn.",
    },
    status: {
      type: String,
      enum: ["pending", "signed"],
      default: "pending",
      description: "Indicates the document signing status.",
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);
export default Document;
