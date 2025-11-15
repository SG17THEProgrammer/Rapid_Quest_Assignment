const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}` , 
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })

);app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect MongoDB (change URI if needed)
mongoose.connect(`${process.env.MONGO_URL}/Rapid_Quest`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Document model
const DocumentSchema = new mongoose.Schema({
  title: String,
  content: String, // extracted text (if available)
  tags: [String],
  fileType: String,
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
});
DocumentSchema.index({ title: "text", content: "text", tags: "text" });
const Document = mongoose.model("Document", DocumentSchema);

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // keep timestamp to avoid collisions
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});
const upload = multer({ storage });


// Helper: extract text for supported types
async function extractText(filePath, fileType) {
  try {
    if (["txt", "md"].includes(fileType)) {
      return fs.readFileSync(filePath, "utf8");
    }

    if (fileType === "pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);   // ← FIXED HERE
      return data.text || "";
    }

    if (fileType === "docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    }

    // for other types (images, video, xlsx)
    return "";
  } catch (err) {
    console.error("Text extraction error:", err);
    return "";
  }
}

/**
 * POST /upload
 * multipart/form-data:
 *  - title
 *  - tags (comma separated)
 *  - content (optional text)
 *  - file (optional)
 */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { title = "", tags = "", content: textContent = "" } = req.body;
    const tagsArr = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    let fileType = null;
    let fileUrl = null;
    let extracted = "";

    if (req.file) {
      const ext = path.extname(req.file.filename).toLowerCase().replace(".", "");
      fileType = ext;
      fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      // Extract text for supported formats
      extracted = await extractText(req.file.path, fileType);
    }

    // prefer user-provided content if present else use extracted text
    const finalContent = textContent && textContent.trim() ? textContent : extracted;

    const doc = new Document({
      title: title || (req.file ? req.file.originalname : "Untitled"),
      content: finalContent || "",
      tags: tagsArr,
      fileType: fileType || (finalContent ? "txt" : null),
      fileUrl,
    });

    await doc.save();

    res.json({ success: true, doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

// GET /search?q=...
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q.trim()) {
      return res.json([]);
    }

    const results = await Document.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /documents/:id
app.get("/documents/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

app.get('/alldocuments', async (req, res) => {
  const allDocs = await Document.find({});
  res.json(allDocs);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
