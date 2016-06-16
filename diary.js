"use strict";

var deviceId = null;
var previewVideo = document.getElementById("previewVideo");
var recordedVideo = document.getElementById("recordedVideo");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var canvas = document.getElementById("canvas");
var height = 300;
var width = 400;
var mediaRecorder = null;
var mediaStream = null;
var videoChunks = [];

var initialiseVideoStream = function(stream) {
  mediaStream = stream;

  previewVideo.src = URL.createObjectURL(mediaStream);
};

var videoConstraints = {
  video : {
    width: width,
    height: height,
    deviceId: deviceId
  }
};

var startPreviewVideo = function() {
  navigator.webkitGetUserMedia(
    videoConstraints,
    initialiseVideoStream,
    function(err) { console.log(err); }
  );
};

var devicesCallback = function(devices) {
  var device = devices[0];
  deviceId = device.deviceId;

  startPreviewVideo();
};

var setupCanvas = function() {
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
};

var onStop = function() {
  console.log("Stopped recording");

  if (videoChunks.length > 0) {
    var videoBlob = new Blob(videoChunks, { type: "video/webm" });
    videoChunks = [];

    var videoURL = URL.createObjectURL(videoBlob);
    recordedVideo.src = videoURL;

    console.log("Playing recorded video");
  }
};

var recordAVideoClip = function() {
  var options = { mimeType: "video/webm;codecs=vp9" };
  mediaRecorder = new MediaRecorder(mediaStream, options);

  var numberOfSecondsPerVideoChunk = 1;
  mediaRecorder.start(numberOfSecondsPerVideoChunk);

  mediaRecorder.ondataavailable = function(event) {
    videoChunks.push(event.data);
  };

  mediaRecorder.onerror = function(event) {
    console.log("Error: ", event);
  };

  mediaRecorder.onstart = function() {
    console.log("Started recording");
  };

  mediaRecorder.onstop = onStop;
};

var stopRecording = function() {
  if (!!mediaRecorder) {
    mediaRecorder.stop();

    mediaRecorder = null;
  }
};

var addButtonListeners = function() {
  recordButton.addEventListener("click", function(event) {
    recordAVideoClip();
    event.preventDefault();
  }, false);

  stopButton.addEventListener("click", function(event) {
    stopRecording();
    event.preventDefault();
  }, false);
};

var init = function() {
  setupCanvas();
  navigator.mediaDevices.enumerateDevices().then(devicesCallback);
  addButtonListeners();
};

init();
