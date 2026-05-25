import { useState, useEffect } from 'react';

/**
 * useImagePreloader — Preloads a list of image URLs.
 * Tracks progress (0 to 100) and returns the loaded HTMLImageElement objects.
 */
export function useImagePreloader(urls) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (!urls || urls.length === 0) {
      const id = setTimeout(() => {
        setLoaded(true);
      }, 0);
      return () => clearTimeout(id);
    }

    let loadedCount = 0;
    const total = urls.length;
    const loadedImages = new Array(total);

    urls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        loadedImages[index] = img;
        setProgress(Math.round((loadedCount / total) * 100));
        if (loadedCount === total) {
          setImages(loadedImages);
          setLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        console.error(`Failed to load image: ${url}`);
        setProgress(Math.round((loadedCount / total) * 100));
        if (loadedCount === total) {
          setImages(loadedImages);
          setLoaded(true);
        }
      };
    });
  }, [urls]);

  return { progress, loaded, images };
}

export default useImagePreloader;
