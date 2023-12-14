import React, { useState, useEffect } from 'react';
import imglyRemoveBackground from "@imgly/background-removal";
import axios from 'axios';

import "./index.css"

function App() {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [originalNames, setOriginalNames] = useState<string[]>([]);
  const [convertedData, setConvertedData] = useState<{ name: string; url: string }[]>([]);
  const [processedImages, setProcessedImages] = useState<any[]>([]); // State to store processed images from the server

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const names = Array.from(files).map(file => file.name);
      setOriginalNames(names);
      setImageFiles(Array.from(files));
    }
  };

  const resizeImage = async (file: File, targetWidth: number, targetHeight: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const aspectRatio = img.width / img.height;

        let width = targetWidth;
        let height = width / aspectRatio;

        if (height > targetHeight) {
          height = targetHeight;
          width = height * aspectRatio;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob!);
        }, file.type);
      };
    });
  };

  useEffect(() => {
    const convertImages = async () => {
      try {
        const promises = imageFiles.map(async (file, index) => {
          console.log(`Converting image ${index + 1}...`);

          const backgroundRemovedBlob = await imglyRemoveBackground(file);

          const convertedUrl = URL.createObjectURL(backgroundRemovedBlob);
          return { name: originalNames[index], url: convertedUrl };
        });

        const resultData = await Promise.all(promises);
        setConvertedData(resultData);
      } catch (error) {
        console.error('Error converting images:', error);
      }
    };

    convertImages();
  }, [imageFiles, originalNames]);

  useEffect(() => {
    if (convertedData.length > 0) {
      const resizeImages = async () => {
        try {
          const formData = new FormData();

          // Convert each processed image URL to a blob and append it to the formData
          await Promise.all(convertedData.map(async (item, index) => {
            const blob = await fetch(item.url).then(res => res.blob());
            formData.append('images', blob, item.name);
          }));

          // Post the processed images to the server
          const response = await axios.post("http://localhost:3001/upload", formData);

          if (response.data.success) {
            console.log('Images uploaded and processed successfully:', response.data.processedImages);
            // Set the processed images in the state
            setProcessedImages(response.data.processedImages);
          } else {
            console.error('Error uploading and processing images:', response.data.error);
          }
        } catch (error) {
          console.error('Error resizing images:', error);
        }
      };

      resizeImages();
    }
  }, [convertedData]);

  return (
    <div className="App">
      <header className="App-header">
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        {processedImages.length === 0 ? (
          <p>Converting images...</p>
        ) : (
          <div>
            {processedImages.map(({ name, data }, index) => (
              <div key={index}>
                <p>{name}</p>
                <img src={`data:image/jpeg;base64,${data}`} className="App-logo" alt={`converted-${index}`} />
              </div>
            ))}
          </div>
        )}
      </header>
      
    </div>
  );
}

export default App;
