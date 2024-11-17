import Document from "../models/documentModel.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
// For PDF handling
import { PDFDocument, rgb } from "pdf-lib";
import docxPdf from "docx-pdf";

dotenv.config();

const MAX_FILE_SIZE = 1 * 1024 * 1024;

// Get the current directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Create the upload folder if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname); // Unique filename
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Function to convert DOCX to PDF
const convertDocxToPdf = (inputDocxPath, outputPdfPath) => {
  return new Promise((resolve, reject) => {
    docxPdf(inputDocxPath, outputPdfPath, (err, result) => {
      if (err) {
        reject("Error converting DOCX to PDF: " + err);
      } else {
        resolve(outputPdfPath);
      }
    });
  });
};

//Upload document
export const uploadDocument = async (req, res) => {
  upload.single("document")(req, res, async (err) => {
    if (err) {
      // Handle file size error
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: `File size exceeds the ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB limit.`,
        });
      }
      return res.status(500).json({ message: err.message });
    }
    try {
      const documentFile = req.file;
      const fileExtension = path
        .extname(documentFile.originalname)
        .toLowerCase();

      let documentPath = `/uploads/${documentFile.filename}`;
      let pdfPath = null;

      // If the uploaded file is a DOCX, convert it to PDF
      if (fileExtension === ".docx") {
        const docxPath = path.resolve("uploads", documentFile.filename);
        console.log("Docx Path:", docxPath);

        // Define the output PDF path
        pdfPath = path.resolve(
          "uploads",
          documentFile.filename.replace(".docx", ".pdf")
        );

        // Convert DOCX to PDF
        await convertDocxToPdf(docxPath, pdfPath);

        // After conversion, update the document path to the PDF
        documentPath = `/uploads/${path.basename(pdfPath)}`;
      }

      const newDocument = new Document({
        name: documentFile.originalname,
        documentPath,
        createdAt: Date.now(),
      });

      await newDocument.save();
      res.status(200).json({
        message: "Document uploaded and converted successfully",
        document: newDocument,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
};

//Upload e-signature
export const uploadSignature = async (req, res) => {
  try {
    const { docId } = req.params;
    const { signature, signatureType } = req.body;

    if (!signature) {
      return res.status(400).json({ message: "No signature provided" });
    }

    // Find the document by docId
    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.status === "signed") {
      return res
        .status(409)
        .json({ message: "Document has already been signed" });
    }

    // Handle typed signature
    if (signatureType === "typed" && signature.trim()) {
      document.signature = signature.trim();
    }
    // Handle drawn signature (Base64)
    else if (signatureType === "drawn" && signature.startsWith("data:image")) {
      const base64Data = signature.replace(/^data:image\/png;base64,/, ""); // Remove the base64 prefix
      const filePath = path.join(
        __dirname,
        "../uploads",
        `${docId}_signature.png`
      ); // Save the file in the uploads folder

      // Write the base64 signature as an image file
      fs.writeFileSync(filePath, base64Data, "base64");

      document.signature = `/uploads/${docId}_signature.png`;
    } else {
      return res
        .status(400)
        .json({ message: "Invalid signature format or type" });
    }

    document.status = "signed";
    document.updatedAt = Date.now();
    document.signatureType = signatureType;

    await document.save();

    res.status(200).json({
      message: "E-signature uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Error uploading signature:", error);
    res.status(500).json({ message: "Server error during signature upload" });
  }
};

const addSignatureToPDF = async (pdfPath, signaturePath, outputPath) => {
  try {
    // Read and load the PDF
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Read and embed the signature image
    const signatureBytes = fs.readFileSync(signaturePath);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    // Get all pages in the document
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Ensure there is at least one page in the document
    if (totalPages < 1) {
      throw new Error("No pages found in the document.");
    }

    // Select the last page
    const lastPage = pages[totalPages - 1];

    // Get the dimensions of the last page
    const { width, height } = lastPage.getSize();

    // Position the signature at the bottom of the last page
    const x = width - 300;
    const y = 50;

    // Draw the signature image on the last page
    lastPage.drawImage(signatureImage, {
      x: x,
      y: y,
      width: 150,
      height: 50,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log("Signature added to the last page of the PDF successfully.");
  } catch (error) {
    console.error("Error adding signature to PDF:", error);
    throw error;
  }
};

const addTypedSignatureToPDF = async (
  documentPath,
  typedSignature,
  outputFilePath
) => {
  try {
    const existingPdfBytes = fs.readFileSync(documentPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get all pages in the document
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Ensure there is at least one page in the document
    if (totalPages < 1) {
      throw new Error("No pages found in the document.");
    }

    // Select the last page
    const lastPage = pages[totalPages - 1];

    // Get the dimensions of the last page
    const { width, height } = lastPage.getSize();

    // Position the signature at the bottom of the last page
    const x = width - 300;
    const y = 50;

    // Draw the signature image on the last page
    lastPage.drawText(typedSignature, {
      x: x,
      y: y,
      size: 24,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFilePath, pdfBytes);
  } catch (error) {
    console.error("Error adding signature to PDF:", error);
    throw error;
  }
};

export const previewDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await Document.findOne({ docId });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const { documentPath, signature, signatureType } = document;

    // Construct the absolute file path
    const documentFullPath = path.join(uploadsDir, path.basename(documentPath));

    // Validate file existence
    if (!fs.existsSync(documentFullPath)) {
      throw new Error(`File not found at path: ${documentFullPath}`);
    }

    // Output directory for previews
    const outputDir = path.join(uploadsDir, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(
      outputDir,
      `${docId}_signed_preview.${path.extname(documentPath).substring(1)}`
    );

    console.log(`Output File Path: ${outputFilePath}`);

    // Case 1: PDF with a drawn signature
    if (documentPath.endsWith(".pdf") && signatureType === "drawn") {
      const signaturePath = path.join(uploadsDir, path.basename(signature));
      await addSignatureToPDF(documentFullPath, signaturePath, outputFilePath);
      return res.status(200).json({
        message: "PDF preview with drawn signature generated successfully",
        previewUrl: `/uploads/output/${docId}_signed_preview.pdf`,
      });
    }

    // Case 2: PDF with a typed signature
    if (documentPath.endsWith(".pdf") && signatureType === "typed") {
      await addTypedSignatureToPDF(documentFullPath, signature, outputFilePath);
      return res.status(200).json({
        message: "PDF preview with typed signature generated successfully",
        previewUrl: `/uploads/output/${docId}_signed_preview.pdf`,
      });
    }

    // If the document type and signature type do not match any case
    return res
      .status(400)
      .json({ message: "Unsupported document type for preview" });
  } catch (error) {
    console.error("Error previewing document:", error.message);
    res
      .status(500)
      .json({ message: `Error previewing document: ${error.message}` });
  }
};

//Get all documents
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ updatedAt: -1 });

    // If no documents are found, return an empty array
    if (!documents || documents.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Get the documents by ID
export const getDocumentById = async (req, res) => {
  const { docId } = req.params;

  try {
    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    console.log(baseUrl);

    // Add the full URL to the document's documentPath
    const fullDocumentPath = `${baseUrl}/api/documents/${document.documentPath}/pdf`;

    res.status(200).json({
      ...document.toObject(),
      documentPath: fullDocumentPath,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Fetch the document PDF
export const getDocumentPDF = async (req, res) => {
  const { docId } = req.params;

  try {
    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const filePath = path.join(
      __dirname,
      `../uploads/${document.documentPath.split("/")[2]}`
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("Error fetching document PDF:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
