"use strict";

var deviceId = null;
var previewVideo = document.getElementById("previewVideo");
var recordedVideo = document.getElementById("recordedVideo");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var recordedVideos = document.getElementById("recordedVideos");
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

var onStart = function() {
  stopButton.disabled = false;
  recordButton.disabled = true;
};

var onStop = function() {
  stopButton.disabled = true;
  recordButton.disabled = false;

  if (videoChunks.length > 0) {
    var videoBlob = new Blob(videoChunks, { type: "video/webm" });
    videoChunks = [];

    var videoURL = URL.createObjectURL(videoBlob);

    var topVideoInStack = document.createElement("video");
    topVideoInStack.autoplay = true;
    topVideoInStack.muted = true;
    topVideoInStack.loop = true;
    topVideoInStack.width = "400";
    topVideoInStack.height = "300";

    topVideoInStack.src = videoURL;

    if (!!recordedVideos.firstChild) {
      recordedVideos.insertBefore(topVideoInStack, recordedVideos.firstChild);
    } else {
      recordedVideos.appendChild(topVideoInStack);
    }

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

  mediaRecorder.onstart = onStart;

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
  navigator.mediaDevices.enumerateDevices().then(devicesCallback);
  addButtonListeners();
};

init();
