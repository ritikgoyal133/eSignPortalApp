import express from "express";
import {
  uploadDocument,
  uploadSignature,
  previewDocument,
  getDocuments,
  getDocumentById,
  getDocumentPDF,
} from "../controllers/documentController.js";

const router = express.Router();

//Get all documents
router.get("/documents", getDocuments);

router.get("/esign/:docId", getDocumentById);

//Upload a document file
router.post("/documents/upload", uploadDocument);

//Uupload an e-signature for a document
router.post("/documents/:docId/sign", uploadSignature);

// Route to get a preview of the document with the e-signature attached
router.get("/documents/:docId/preview", previewDocument);

//Route to fetch pdf
router.get("/documents/uploads/:docId/pdf", getDocumentPDF);

export default router;
