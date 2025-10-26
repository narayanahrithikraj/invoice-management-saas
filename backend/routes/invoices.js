const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Invoice = require('../models/Invoice.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import File System module
const vision = require('@google-cloud/vision');
// Import Google AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google AI with API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Correct model initialization
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Initialize Vision AI Client (assuming GOOGLE_APPLICATION_CREDENTIALS is set in .env)
const visionClient = new vision.ImageAnnotatorClient();

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept file
  } else {
    // Reject file and add error info to request for better handling
    req.fileFilterError = 'Invalid file type. Only PDF and image files are allowed.';
    cb(null, false); // Reject file gracefully
  }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Optional: Limit file size (e.g., 10MB)
});
// --- End Multer Configuration ---


// Apply auth middleware to all routes below this
router.use(authMiddleware);

// --- UPDATED: Route for Uploading and Processing Invoice with More Logging ---
router.post('/upload', upload.single('invoiceFile'), async (req, res) => {
    // Multer error handling (check if file exists and if filter rejected)
    if (!req.file) {
        // Use the error message attached by the fileFilter if it exists
        const errorMessage = req.fileFilterError || 'No file uploaded or file type rejected by server.';
        console.log('[Upload] Multer error or no file:', errorMessage); // Log Multer issues
        return res.status(400).json({ message: errorMessage });
    }

    const filePath = req.file.path;
    console.log('[Upload] File received by server at path:', filePath); // Log file path

    // Check if the file actually exists at this path right after upload
    if (!fs.existsSync(filePath)) {
         console.error('[Upload] CRITICAL ERROR: File path does not exist immediately after upload:', filePath);
         // Attempt to clean up just in case, though unlikely needed if file doesn't exist
         fs.unlink(filePath, (unlinkErr) => { if (unlinkErr) console.error("[Upload] Error deleting non-existent file path:", filePath, unlinkErr); });
         return res.status(500).json({ message: 'Server error during file handling.' });
    }
    console.log('[Upload] File exists at path confirmed.');

    try {
        console.log('[Upload] Attempting to call Google Cloud Vision AI...'); // Log before API call
        const [result] = await visionClient.documentTextDetection(filePath);
        console.log('[Upload] Google Cloud Vision AI call completed.'); // Log after API call

        // Log the structure of the result to understand what Vision AI returned
        console.log('[Upload] Vision API Result structure keys:', result ? Object.keys(result) : 'Result is null/undefined');

        const fullTextAnnotation = result.fullTextAnnotation;

        // Clean up the temporary file *after* successful processing
        fs.unlink(filePath, (err) => {
            if (err) console.error("[Upload] Error deleting temp file after successful OCR:", filePath, err);
            else console.log("[Upload] Deleted temp file after successful OCR:", filePath);
        });

        if (fullTextAnnotation && fullTextAnnotation.text) {
            console.log('[Upload] OCR Extraction successful. Text length:', fullTextAnnotation.text.length);
            // Send ONLY the extracted text back for the next step (parsing)
            res.status(200).json({
                message: 'File processed, text extracted.',
                extractedText: fullTextAnnotation.text
            });
        } else {
            // Log if text is missing even if the API call seemed successful
            console.log('[Upload] OCR completed but no text annotation found in the result.');
            // Log the full result for debugging ONLY if no text was found
            console.log('[Upload] Full Vision API Result (if no text found):', JSON.stringify(result, null, 2));
            res.status(400).json({ message: 'No text could be extracted from the uploaded file.' });
        }

    } catch (err) {
        // This is the block that sends the generic error message to the frontend
        console.error('[Upload] ERROR caught during OCR processing:', err); // Log the specific error object details

        // Attempt to clean up the temp file even if there's an error during processing
        // Check existence again before unlinking in catch block
        if(fs.existsSync(filePath)) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error("[Upload] Error deleting temp file after Vision error:", filePath, unlinkErr);
                else console.log("[Upload] Deleted temp file after Vision error:", filePath);
            });
        } else {
             console.log("[Upload] Temp file path did not exist during error cleanup:", filePath);
        }

        res.status(500).json({ message: 'Error processing file with OCR.' }); // Send generic error to frontend
    }
});


// --- Route for AI Parsing ---
// Takes raw text and returns structured JSON data
router.post('/parse-text', async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ message: 'No valid text provided for parsing.' });
    }

    // Define the prompt for Gemini
    const prompt = `
        Extract the following details from the invoice text below. Respond ONLY with a valid JSON object containing these keys (use null or an empty string "" if a value is not found, do not make up data):
        - clientName (string): The name of the client or company being billed.
        - clientEmail (string): The email address of the client, if available.
        - invoiceId (string): The specific invoice number or ID.
        - invoiceDate (string): The date the invoice was issued (try format YYYY-MM-DD, otherwise as found).
        - dueDate (string): The date the payment is due (try format YYYY-MM-DD, otherwise as found).
        - description (string): A brief summary, like the first line item or service rendered.
        - totalAmount (number): The final total amount due, as a number without currency symbols or commas.

        Invoice Text:
        ---
        ${text}
        ---
    `;

    try {
        console.log("[Parse] Sending text to Gemini for parsing...");
        const result = await model.generateContent(prompt);
        const response = result.response;
        let jsonResponseText = response.text();

        console.log("[Parse] Gemini Raw Response Text:", jsonResponseText);

        // Clean the response: remove markdown, trim whitespace
        jsonResponseText = jsonResponseText
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

        // Attempt to parse the cleaned text as JSON
        const parsedData = JSON.parse(jsonResponseText);
        console.log("[Parse] Successfully Parsed Data:", parsedData);

        // Basic validation/conversion of parsed data
        if (parsedData.totalAmount && typeof parsedData.totalAmount === 'string') {
             // Try to convert amount string to number
             const amountNum = parseFloat(parsedData.totalAmount.replace(/[^0-9.]/g, ''));
             parsedData.totalAmount = isNaN(amountNum) ? null : amountNum;
        } else if (parsedData.totalAmount === undefined) {
            parsedData.totalAmount = null; // Ensure key exists even if null
        }

        // Ensure other keys exist, even if null/empty
        const requiredKeys = ['clientName', 'clientEmail', 'invoiceId', 'invoiceDate', 'dueDate', 'description', 'totalAmount'];
        requiredKeys.forEach(key => {
            if (!(key in parsedData)) {
                parsedData[key] = null; // Or use "" based on expected type
            }
        });


        res.status(200).json({
            message: 'Text parsed successfully.',
            parsedData: parsedData
        });

    } catch (err) {
        console.error('[Parse] Gemini API Error or JSON Parsing Error:', err);
        // Log the raw text if parsing failed specifically
        if (err instanceof SyntaxError) {
             console.error("[Parse] Failed to parse Gemini response as JSON. Raw text was:", jsonResponseText);
             return res.status(500).json({ message: 'AI model returned unexpected format. Could not parse details.' });
        }
        res.status(500).json({ message: 'Error parsing invoice text with AI.' });
    }
});
// --- END AI Parsing Route ---


// --- Existing CRUD Routes ---

// GET all invoices (for the logged-in user)
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
      console.error("[GET /] Error fetching invoices:", err);
      res.status(500).json({ message: 'Failed to fetch invoices.' });
  }
});

// CREATE a new invoice (MANUAL or from verified OCR data)
router.post('/', async (req, res) => {
   // Validate required fields coming from frontend (manual or verified OCR)
   const { clientName, clientEmail, description, amount, status, /* add other fields like dueDate, invoiceDate if needed */ } = req.body;
   if (!clientName || !description || amount === undefined || amount === null) {
       return res.status(400).json({ message: 'Client name, description, and amount are required.' });
   }
   // Convert amount to number and validate
    const numericAmount = Number(amount);
   if (isNaN(numericAmount)) {
        return res.status(400).json({ message: 'Amount must be a valid number.' });
   }

  const newInvoice = new Invoice({
    user: req.user.id,
    clientName,
    clientEmail: clientEmail || '', // Use empty string if null/undefined
    description,
    amount: numericAmount, // Ensure amount is stored as a number
    status: status || 'pending', // Default to pending if not provided
    // Add dueDate, invoiceDate if included in req.body and model
    // invoiceDate: req.body.invoiceDate ? new Date(req.body.invoiceDate) : undefined,
    // dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
  });
  try {
    const savedInvoice = await newInvoice.save();
    console.log("[POST /] Invoice saved successfully:", savedInvoice._id);
    res.status(201).json(savedInvoice);
  } catch (err) {
    console.error("!!! BACKEND INVOICE SAVE ERROR:", err);
     if (err.name === 'ValidationError') {
         return res.status(400).json({ message: `Validation Error: ${err.message}` });
     }
    res.status(500).json({ message: 'Failed to save invoice.' });
  }
});

// DELETE an invoice
router.delete('/:id', async (req, res) => {
    try {
        const deletedInvoice = await Invoice.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
        });
        if (!deletedInvoice) {
             return res.status(404).json({ message: 'Invoice not found or user not authorized' });
        }
        console.log("[DELETE /:id] Invoice deleted:", req.params.id);
        res.json({ message: 'Invoice deleted successfully' });
    } catch (err) {
        console.error("!!! BACKEND DELETE ERROR:", err);
        res.status(500).json({ message: 'Failed to delete invoice.' });
    }
});

// UPDATE an invoice's status (Mark as Paid)
router.patch('/:id', async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { status: 'paid' }, // Only update status to paid
        { new: true }       // Return the updated document
        );
        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice not found or user not authorized' });
        }
        console.log("[PATCH /:id] Invoice marked as paid:", req.params.id);
        res.json(updatedInvoice);
    } catch (err) {
        console.error("!!! BACKEND UPDATE ERROR:", err);
        res.status(500).json({ message: 'Failed to update invoice status.' });
    }
});

module.exports = router;