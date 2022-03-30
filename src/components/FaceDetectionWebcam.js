import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
//import { canvas, faceDetectionNet, faceDetectionOptions, saveFile } from './commons';
import React, { useState, useEffect, useRef } from 'react';






const FaceDetectionWebcam = (props) => {

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [captureVideo, setCaptureVideo] = useState(false);

    const videoRef = useRef();
    const videoHeight = 480;
    const videoWidth = 640;
    const canvasRef = useRef();

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = process.env.PUBLIC_URL + '/models';

            Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            ]).then((val) => {
                console.log('models loaded');
                console.log(val);
                setModelsLoaded(true);
            }).catch((err) => {
                console.log(err)
            });
        }
        loadModels();
    }, []);

    const startVideo = () => {
        setCaptureVideo(true);
        navigator.mediaDevices
            .getUserMedia({ video: { width: 300 } })
            .then(stream => {
                let video = videoRef.current;
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                console.error("error:", err);
            });
    }


    const drawInfoGender = (age, gender, genderProbability, result, canvas) => {
        new faceapi.draw.DrawTextField(
          [
            `${faceapi.utils.round(age, 0)} years`,
            `${gender} (${faceapi.utils.round(genderProbability)})`
          ],
          result.detection.box.bottomRight
        ).draw(canvas)
    }

    const handleVideoOnPlay = () => {
        setInterval(async () => {
            const canvas = canvasRef.current;
            if (canvasRef && canvas) {
                canvas.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
                const displaySize = {
                    width: videoWidth,
                    height: videoHeight
                }

                faceapi.matchDimensions(canvas, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                
                const { age, gender, genderProbability } = resizedDetections[0]
                
                canvasRef && canvas && canvas.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
                canvasRef && canvas && faceapi.draw.drawDetections(canvas, resizedDetections);
                canvasRef && canvas && faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                canvasRef && canvas && faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
                canvasRef && canvas && age && gender && genderProbability && drawInfoGender(age, gender, genderProbability, resizedDetections[0], canvas);
            }
        }, 100)
    }

    const closeWebcam = () => {
        videoRef.current.pause();
        videoRef.current.srcObject.getTracks()[0].stop();
        setCaptureVideo(false);
    }

    return (
        <div>
            <div style={{ textAlign: 'center', padding: '10px' }}>
                {
                    captureVideo && modelsLoaded ?
                        <button onClick={closeWebcam} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
                            Close Webcam
                        </button>
                        :
                        <button onClick={startVideo} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
                            Open Webcam
                        </button>
                }
            </div>
            {
                captureVideo ?
                    modelsLoaded ?
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                                <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px' }} />
                                <canvas ref={canvasRef} style={{ position: 'absolute' }} />
                            </div>
                        </div>
                        :
                        <div>loading...</div>
                    :
                    <>
                    </>
            }
        </div>
    );
}

export default FaceDetectionWebcam;