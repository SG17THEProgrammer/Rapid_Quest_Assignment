import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  TextField,
  Typography,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import AllDocuments from "./AllDocuments";
import { useEffect } from "react";
import { useRef } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [uploadData, setUploadData] = useState({
  title: "",
  content: "",
  tags: "",
  file: null,
});

  const searchDocs = async () => {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/search?q=${query}`);
    setResults(res.data);
    setSelected(null);
  };

  const uploadDoc = async () => {
  try {
    if (!uploadData.title && !uploadData.file) {
      alert("Please provide a title or choose a file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", uploadData.title);
    formData.append("tags", uploadData.tags);
    formData.append("content", uploadData.content);
    if (uploadData.file) formData.append("file", uploadData.file);

    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.success) {
      alert("Uploaded successfully!");
      // reset
      setUploadData({ title: "", content: "", tags: "", file: null });
      // optionally refresh documents / search results
      await searchDocs(); // if you want to refresh results immediately
    } else {
      alert("Upload failed");
    }
  } catch (err) {
    console.error(err);
    alert("Upload error");
  }
};

  const openDoc = async (id) => {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/documents/${id}`);
    setSelected(res.data);
  };

  const [allDocs, setAllDocs] = useState()

  useEffect(() => {
    const getAllDocs = async () => {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/alldocuments`);
      setAllDocs(res.data);
    }
    getAllDocs()
  }, [allDocs])

  const docsRef = useRef(null);

  const scrollToDocs = () => {
    docsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>

        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🔬 Internal Knowledge Search
        </Typography>

        <Button variant="contained" onClick={scrollToDocs}>See All Documents</Button>

      </Box>

      {/* Search */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <TextField
          variant="outlined"
          label="Search documents..."
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" onClick={searchDocs}>
          Search
        </Button>
      </Stack>

      {/* Upload Section */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upload New Document
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Title"
            value={uploadData.title}
            onChange={(e) =>
              setUploadData({ ...uploadData, title: e.target.value })
            }
            fullWidth
          />

          {/* File uploader for pdf, docx, txt, images */}
          <Button variant="outlined" component="label">
            Upload File (pdf, docx, txt, png, jpg)
            <input
              type="file"
              hidden
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  file: e.target.files[0]
                })
              }
            />
          </Button>

          {/* Show file name if selected */}
          {uploadData.file && (
            <Typography variant="body2" sx={{ color: "green" }}>
              Selected: {uploadData.file.name}
            </Typography>
          )}

          {/* Optional extra text content field */}
          <TextField
            label="Content (optional)"
            multiline
            minRows={4}
            value={uploadData.content}
            onChange={(e) =>
              setUploadData({ ...uploadData, content: e.target.value })
            }
            fullWidth
          />

          <TextField
            label="Tags (comma separated)"
            value={uploadData.tags}
            onChange={(e) =>
              setUploadData({ ...uploadData, tags: e.target.value })
            }
            fullWidth
          />

          <Button variant="contained" onClick={uploadDoc}>
            Upload Document
          </Button>
        </Stack>
      </Card>


      <Stack direction="row" spacing={3}>
        {/* Results */}
        <Box width="40%">
          <Typography variant="h6">Search Results</Typography>
          <Divider sx={{ mb: 2 }} />

          {results?.length > 0 ? results?.map((doc) => (
            <Card
              key={doc._id}
              sx={{ mb: 2, cursor: "pointer" }}
              onClick={() => openDoc(doc._id)}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {doc?.title}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {doc?.content.substring(0, 100)}...
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {doc?.tags?.map((tag) => (
                    <Chip label={tag} key={tag} size="small" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )) : <Alert severity="error" sx={{ mb: 4 }}>No result found</Alert>}
        </Box>

        {/* Preview */}
        <Box width="60%"  >
          <Typography variant="h6">Preview</Typography>
          <Divider sx={{ mb: 2 }} />
          {selected ?
            <Card sx={{ p: 2, mb: 5 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {selected.title}
              </Typography>

              <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                {selected.content}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {selected.tags?.map((tag) => (
                  <Chip label={tag} key={tag} />
                ))}
              </Stack>
            </Card>
            : <Alert severity="error" sx={{ mb: 4 }}>No preview found</Alert>}
        </Box>
      </Stack>

      <Box ref={docsRef}>
        <AllDocuments allDocs={allDocs}></AllDocuments>

      </Box>
    </Container>
  );
}

export default App;
