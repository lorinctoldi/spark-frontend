import React, { useState, useEffect } from "react";
import imglyRemoveBackground from "@imgly/background-removal";
import axios from "axios";

import "./index.css";

function App() {
  const [time, setTime] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 100);
      }, 100);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = time % 1000;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  };

  const [menu, setMenu] = useState(false);
  const [remove_o, setRemove_o] = useState(false);
  const [resize_o, setResize_o] = useState(false);
  const [combine_o, setCombine_o] = useState(true);
  const [spark_o, setSpark_o] = useState(true);
  const [ym_o, setYM_o] = useState(false);
  const [choosen, setChoosen] = useState(-1);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [originalNames, setOriginalNames] = useState<string[]>([]);
  const [convertedData, setConvertedData] = useState<
    { name: string; url: string }[]
  >([]);
  const [processedImages, setProcessedImages] = useState<any[]>([]); // State to store processed images from the server

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleReset();
    handleStart();
    setProcessedImages([]);
    const files = e.target.files;
    if (files) {
      const names = Array.from(files).map((file) => file.name);
      setOriginalNames(names);
      setImageFiles(Array.from(files));
    }
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
        console.error("Error converting images:", error);
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
          await Promise.all(
            convertedData.map(async (item, index) => {
              const blob = await fetch(item.url).then((res) => res.blob());
              formData.append("images", blob, item.name);
            })
          );

          // Post the processed images to the server
          const response = await axios.post(
            "http://localhost:3001/upload",
            formData
          );

          if (response.data.success) {
            console.log(
              "Images uploaded and processed successfully:",
              response.data.processedImages
            );
            // Set the processed images in the state
            setProcessedImages(response.data.processedImages);
            handlePause();
          } else {
            console.error(
              "Error uploading and processing images:",
              response.data.error
            );
          }
        } catch (error) {
          console.error("Error resizing images:", error);
        }
      };

      resizeImages();
    }
  }, [convertedData]);

  return (
    <div className="w-screen">
      <div
        onClick={(e) => {
          if (e.target == e.currentTarget) setMenu(false);
        }}
        className={`menu ${
          menu ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="menu-block">
          <div className="menu-inner">
            <h1 className="text-white font-semibold text-[17px] mb-[30px]">
              Settings
            </h1>
            <div className="menu-stack">
              <div className="menu-option">
                <span>Remove Background</span>
                <div
                  className="switch"
                  onClick={() => {
                    setRemove_o(!remove_o);
                    setResize_o(false);
                    setCombine_o(false);
                  }}
                >
                  <div
                    className={`switch-bg ${
                      remove_o ? "bg-[rgb(52,199,89)]" : "bg-[rgb(40,40,40)]"
                    }`}
                  ></div>
                  <div
                    className={`switch-bt ${
                      remove_o ? "translate-x-[22px]" : "translate-x-0"
                    }`}
                  >
                    <div className="switch-bt-inner"></div>
                  </div>
                </div>
              </div>
              <div className="line"></div>
              <div className="menu-option">
                <span>Resize Image</span>
                <div
                  className="switch"
                  onClick={() => {
                    setRemove_o(false);
                    setResize_o(!resize_o);
                    setCombine_o(false);
                  }}
                >
                  <div
                    className={`switch-bg ${
                      resize_o ? "bg-[rgb(52,199,89)]" : "bg-[rgb(40,40,40)]"
                    }`}
                  ></div>
                  <div
                    className={`switch-bt ${
                      resize_o ? "translate-x-[22px]" : "translate-x-0"
                    }`}
                  >
                    <div className="switch-bt-inner"></div>
                  </div>
                </div>
              </div>
              <div className="line"></div>
              <div className="menu-option">
                <span>Remove & Resize</span>
                <div
                  className="switch"
                  onClick={() => {
                    setRemove_o(false);
                    setResize_o(false);
                    setCombine_o(!combine_o);
                  }}
                >
                  <div
                    className={`switch-bg ${
                      combine_o ? "bg-[rgb(52,199,89)]" : "bg-[rgb(40,40,40)]"
                    }`}
                  ></div>
                  <div
                    className={`switch-bt ${
                      combine_o ? "translate-x-[22px]" : "translate-x-0"
                    }`}
                  >
                    <div className="switch-bt-inner"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="menu-stack">
              <div className="menu-option">
                <span>Spark Le Monde</span>
                <div
                  className="switch"
                  onClick={() => {
                    setSpark_o(!spark_o);
                    setYM_o(!ym_o);
                  }}
                >
                  <div
                    className={`switch-bg ${
                      spark_o && (combine_o || resize_o)
                        ? "bg-[rgb(52,199,89)]"
                        : "bg-[rgb(40,40,40)]"
                    }`}
                  ></div>
                  <div
                    className={`switch-bt ${
                      spark_o && (combine_o || resize_o)
                        ? "translate-x-[22px]"
                        : "translate-x-0"
                    }`}
                  >
                    <div className="switch-bt-inner"></div>
                  </div>
                </div>
              </div>
              <div className="line"></div>
              <div className="menu-option">
                <span>Yellow Moon</span>
                <div
                  className="switch"
                  onClick={() => {
                    setSpark_o(!spark_o);
                    setYM_o(!ym_o);
                  }}
                >
                  <div
                    className={`switch-bg ${
                      ym_o && (combine_o || resize_o)
                        ? "bg-[rgb(52,199,89)]"
                        : "bg-[rgb(40,40,40)]"
                    }`}
                  ></div>
                  <div
                    className={`switch-bt ${
                      ym_o && (combine_o || resize_o)
                        ? "translate-x-[22px]"
                        : "translate-x-0"
                    }`}
                  >
                    <div className="switch-bt-inner"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="input">
              <input
                className="absolute w-full h-full opacity-0"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleFileChange(e);
                  setMenu(false);
                }}
              />
              <span>Upload Files</span>
            </div>
          </div>
        </div>
      </div>

      {processedImages.length !== 0 && choosen !== -1 ? (
        <div className={`image-viewer ${
          choosen !== -1 ? "visible opacity-100" : "invisible opacity-0"
        }`} onClick={(e) => {
          if (e.target == e.currentTarget) setChoosen(-1);
        }}>
          <div className="image-viewer-block">
            <div className="iv-i">
              <img
                src={`data:image/jpeg;base64,${processedImages[choosen].data}`}
                className="w-full h-full"
                alt={`converted-${choosen}`}
              />
            </div>
            <div className="iv-options">
              <div className="iv-option">
                <div className="iv-o-l">Open</div>
                <div className="iv-o-r">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 19.451C12.7255 19.451 14.951 15.4216 14.951 10.0197C14.951 4.58825 12.7354 0.558825 10 0.558825C7.26472 0.558825 5.04903 4.58825 5.04903 10.0197C5.04903 15.4216 7.27452 19.451 10 19.451ZM10 1.7451C11.9216 1.7451 13.6373 5.56864 13.6373 10.0197C13.6373 14.3922 11.9216 18.2549 10 18.2549C8.07845 18.2549 6.36276 14.3922 6.36276 10.0197C6.36276 5.56864 8.07845 1.7451 10 1.7451ZM9.36276 0.69608V19.2647H10.6471V0.69608H9.36276ZM10 13.6863C6.98041 13.6863 4.30393 14.4804 2.93138 15.7451L3.92158 16.5589C5.2157 15.5294 7.32355 14.9706 10 14.9706C12.6765 14.9706 14.7844 15.5294 16.0785 16.5589L17.0686 15.7451C15.6961 14.4804 13.0196 13.6863 10 13.6863ZM19.049 9.35297H0.950983V10.6372H19.049V9.35297ZM10 6.36276C13.0196 6.36276 15.6961 5.56864 17.0686 4.30393L16.0785 3.49021C14.7844 4.50981 12.6765 5.07844 10 5.07844C7.32355 5.07844 5.2157 4.50981 3.92158 3.49021L2.93138 4.30393C4.30393 5.56864 6.98041 6.36276 10 6.36276ZM10 20C15.4706 20 20 15.4608 20 10C20 4.52942 15.4608 0 9.99021 0C4.52942 0 0 4.52942 0 10C0 15.4608 4.53922 20 10 20ZM10 18.6667C5.26472 18.6667 1.33334 14.7353 1.33334 10C1.33334 5.26472 5.25491 1.33334 9.99021 1.33334C14.7256 1.33334 18.6667 5.26472 18.6667 10C18.6667 14.7353 14.7353 18.6667 10 18.6667Z" fill="hsl(0, 0%, 93.0%)"></path></svg>
                </div>
              </div>
              <div className="iv-option">
                <div className="iv-o-l">Copy</div>
                <div className="iv-o-r">
                <svg width="20" height="20" viewBox="0 0 17 22" fill="none"><path d="M0.0253906 18.8359C0.0253906 20.5708 0.880371 21.4424 2.59863 21.4424H10.4014C12.1196 21.4424 12.9746 20.5625 12.9746 18.8359V17.3003H14.4272C16.1372 17.3003 17.0005 16.4204 17.0005 14.6938V7.95361C17.0005 6.93262 16.793 6.28516 16.1704 5.646L11.9785 1.3877C11.3892 0.781738 10.6919 0.557617 9.80371 0.557617H6.62451C4.91455 0.557617 4.05127 1.4375 4.05127 3.16406V4.69971H2.59863C0.888672 4.69971 0.0253906 5.57129 0.0253906 7.30615V18.8359ZM12.186 10.145L7.6123 5.48828C6.98145 4.84082 6.4585 4.69971 5.52881 4.69971H5.3877V3.18896C5.3877 2.36719 5.82764 1.89404 6.69092 1.89404H10.3599V6.15234C10.3599 7.11523 10.8247 7.57178 11.7793 7.57178H15.6641V14.6689C15.6641 15.499 15.2158 15.9639 14.3525 15.9639H12.9746V12.353C12.9746 11.2905 12.8501 10.8257 12.186 10.145ZM11.5635 5.95312V2.5498L15.3154 6.36816H11.9702C11.6797 6.36816 11.5635 6.24365 11.5635 5.95312ZM1.36182 18.811V7.32275C1.36182 6.50928 1.80176 6.03613 2.66504 6.03613H5.3877V10.8506C5.3877 11.8965 5.91895 12.4194 6.94824 12.4194H11.6382V18.811C11.6382 19.6411 11.1899 20.106 10.335 20.106H2.65674C1.80176 20.106 1.36182 19.6411 1.36182 18.811ZM7.10596 11.166C6.77393 11.166 6.64111 11.0332 6.64111 10.7012V6.34326L11.3809 11.166H7.10596Z" fill="hsl(0, 0%, 93.0%)"></path></svg>
                </div>
              </div>
              <div className="iv-option">
                <div className="iv-o-l">Save</div>
                <div className="iv-o-r">
                <svg width="20" height="20" viewBox="0 0 16 20" fill="none"><path d="M7.85999 13.0616C8.24103 13.0616 8.5689 12.7426 8.5689 12.3704V3.26983L8.51573 1.94063L9.10944 2.56978L10.4564 4.00532C10.5804 4.1471 10.7576 4.21799 10.9349 4.21799C11.2982 4.21799 11.5817 3.95215 11.5817 3.58883C11.5817 3.40275 11.502 3.26097 11.3691 3.12805L8.37395 0.239256C8.19672 0.0620292 8.04608 0 7.85999 0C7.68276 0 7.53212 0.0620292 7.34603 0.239256L4.35091 3.12805C4.21799 3.26097 4.1471 3.40275 4.1471 3.58883C4.1471 3.95215 4.41294 4.21799 4.78511 4.21799C4.95348 4.21799 5.14843 4.1471 5.27249 4.00532L6.61055 2.56978L7.21311 1.94063L7.15995 3.26983V12.3704C7.15995 12.7426 7.47895 13.0616 7.85999 13.0616ZM2.78245 20H12.9464C14.7984 20 15.7288 19.0784 15.7288 17.253V8.40939C15.7288 6.58396 14.7984 5.66238 12.9464 5.66238H10.4741V7.08906H12.9198C13.7971 7.08906 14.3022 7.56757 14.3022 8.48914V17.1732C14.3022 18.0948 13.7971 18.5733 12.9198 18.5733H2.80018C1.91405 18.5733 1.42667 18.0948 1.42667 17.1732V8.48914C1.42667 7.56757 1.91405 7.08906 2.80018 7.08906H5.25476V5.66238H2.78245C0.930439 5.66238 0 6.58396 0 8.40939V17.253C0 19.0784 0.930439 20 2.78245 20Z" fill="hsl(0, 0%, 93.0%)"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}

      <div className="flex pt-[60px] pb-[40px] items-center justify-center h-24">
        <div
          onClick={() => setMenu(true)}
          className="search-bar w-[460px] h-[42px] rounded-[12px] bg-[rgba(118,118,128,0.12)] flex items-center justify-center cursor-pointer"
        >
          <h1 className="text-gray-400 text-[18px]">Start</h1>
        </div>
      </div>

      {processedImages.length === 0 ? (
        imageFiles.length === 0 ? (
          <div></div>
        ) : (
          <div>
          <div className="w-full h-[75vh] flex items-center justify-center flex-col gap-[20px]">
            <span className="loader"></span>
            <h1 className="text-white font-bold">{formatTime(time)}</h1>
          </div>
          </div>
        )
      ) : (
        <div className="mansory">
          {processedImages.map(({ name, data }, index) => (
            <div onClick={() => setChoosen(index)} className="mansory-item" key={index}>
              <img
                src={`data:image/jpeg;base64,${data}`}
                className="w-full h-full"
                alt={`converted-${index}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
