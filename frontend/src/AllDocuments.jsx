import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Skeleton,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const ITEMS_PER_LOAD = 6;

export default function AllDocuments({ allDocs }) {
  const [visibleDocs, setVisibleDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  // Initial load
  useEffect(() => {
    setVisibleDocs(allDocs?.slice(0, ITEMS_PER_LOAD));
  }, [allDocs]);

  // Load more function
  const loadMore = () => {
    if (loading) return;

    const alreadyVisible = visibleDocs?.length;
    const totalDocs = allDocs?.length;

    // If no more docs, stop
    if (alreadyVisible >= totalDocs) return;

    setLoading(true);

    setTimeout(() => {
      const nextDocs = allDocs?.slice(
        alreadyVisible,
        alreadyVisible + ITEMS_PER_LOAD
      );
      setVisibleDocs((prev) => [...prev, ...nextDocs]);
      setLoading(false);
    }, 500);
  };

  // IntersectionObserver logic
  useEffect(() => {
    if (!loadMoreRef.current) return;

    // Disconnect old observer to avoid multiple observers attaching
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];

        // Only load more if not already loading and docs remain
        if (first.isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: "80px" }
    );

    observer.observe(loadMoreRef.current);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [visibleDocs, loading, allDocs]);

  // Stop showing the loader div if everything is loaded
  const noMoreDocs = visibleDocs?.length >= allDocs?.length;

  console.log(allDocs);

  return (
    <Box sx={{ px: 3, py: 4 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        All Documents ({allDocs?.length} documents)
      </Typography>

      <Grid container spacing={3}>
        {visibleDocs?.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc._id} sx={{ width: "100%" }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                transition: "0.25s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 6px 22px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardContent>
                <Box sx={{display:"flex" , justifyContent:"space-between" , alignItems:"center" , marginBottom:"20px"}}>

                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {doc.title || 'N/A'}
                  </Typography>

                  {doc?.fileUrl ? <a href={doc?.fileUrl} target="_blank" rel="noopener noreferrer">
                    <PictureAsPdfIcon
                      sx={{ fontSize: 40, color: "red", cursor: "pointer" }}
                    />
                  </a>:""}
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: "grey.700", mb: 2 }}
                  noWrap
                >
                  {doc.content || 'N/A'}
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {doc.tags?.map((tag) => (
                    <Chip
                      label={tag || 'N/A'}
                      key={tag}
                      size="small"
                      sx={{
                        bgcolor: "primary.light",
                        color: "white",
                        fontSize: "0.7rem",
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Show skeleton only while loading */}
        {loading &&
         <Typography sx={{textAlign:'center' , width:"100%"}}>Loading....</Typography>}
      </Grid>

      {/* Lazy loader trigger */}
      {!noMoreDocs && (
        <div ref={loadMoreRef} style={{ height: 60 }} />
      )}
    </Box>
  );
}
