// Temporary passthrough worker - just returns the original file
// This allows uploads to work while we fix ffmpeg compression
self.onmessage = async (event) => {
  try {
    const { file } = event.data;
    
    // Simulate progress
    self.postMessage({ progress: 0.1, time: 0 });
    
    // Small delay to show UI feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    self.postMessage({ progress: 0.5, time: 0.5 });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    self.postMessage({ progress: 0.9, time: 1 });
    
    // Return original file as Uint8Array (not transferable ArrayBuffer)
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Send back as compressed (it's actually the original, but provider expects this property)
    self.postMessage({ compressed: uint8Array });
    
  } catch (err) {
    self.postMessage({ error: err?.message || 'Processing failed' });
  }
};
