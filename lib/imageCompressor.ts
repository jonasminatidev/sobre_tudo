/**
 * Client-side image compression utility using HTML5 Canvas.
 * Resizes high-resolution images (e.g. 4K) to configurable maximum dimensions (default 1920px)
 * and compresses them to WebP format (~82% quality), dramatically reducing payload size
 * before uploading to storage/database.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options;

  // Skip compression on server-side or non-image files
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  // Skip animated GIFs and vector SVGs to preserve animation and vector crispness
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Calculate scaled dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback to original if canvas context is unavailable
        return;
      }

      // Enable high-quality image smoothing for downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If compression doesn't actually reduce size, keep original file
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const originalName =
            file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const ext = mimeType === 'image/webp' ? '.webp' : '.jpg';
          const compressedFile = new File([blob], `${originalName}${ext}`, {
            type: mimeType,
            lastModified: Date.now(),
          });

          console.log(
            `Imagem compactada: ${file.name} (${(file.size / 1024).toFixed(1)}KB) -> ${compressedFile.name} (${(blob.size / 1024).toFixed(1)}KB)`
          );

          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original on error
    };

    img.src = objectUrl;
  });
}
