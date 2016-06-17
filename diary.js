"use strict";

var previewVideo = document.getElementById("previewVideo");
var recordedVideo = document.getElementById("recordedVideo");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var recordedVideos = document.getElementById("recordedVideos");
var magnetLink = document.getElementById("magnetLink");
var remoteVideo = document.getElementById("remoteVideo");
var inputMagnetLink = document.getElementById("inputMagnetLink");
var getRemoteVideoButton = document.getElementById("getRemoteVideoButton");

var deviceId = null;
var height = 300;
var width = 400;
var mediaRecorder = null;
var mediaStream = null;
var videoChunks = [];
var database = null;
var webTorrentClient = null;
var lastVideoBlob = null;

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
    function(err) { console.err(err); }
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

var pushVideoOntoStack = function(videoBlob) {
  var videoURL = URL.createObjectURL(videoBlob);

  var topVideoInStack = document.createElement("video");
  topVideoInStack.autoplay = true;
  topVideoInStack.muted = true;
  topVideoInStack.loop = true;
  topVideoInStack.width = "400";
  topVideoInStack.height = "300";

  topVideoInStack.src = videoURL;

  var topVideoDiv = document.createElement("div");
  topVideoDiv.appendChild(topVideoInStack);

  if (!!recordedVideos.firstChild) {
    recordedVideos.insertBefore(topVideoDiv, recordedVideos.firstChild);
  } else {
    recordedVideos.appendChild(topVideoDiv);
  }

  lastVideoBlob = videoBlob;
};

var storeVideo = function(videoBlob) {
  var objectStore = database.transaction("videos", "readwrite").objectStore("videos");

  var key = Date.now();
  objectStore.put(videoBlob, key);
};

var updateMagnetLink = function(torrent) {
  magnetLink.innerHTML = torrent.magnetURI;
};

var seedVideo = function(videoBlob) {
  webTorrentClient.seed(videoBlob, updateMagnetLink);
};

var onStop = function() {
  stopButton.disabled = true;
  recordButton.disabled = false;

  if (videoChunks.length > 0) {
    var videoBlob = new Blob(videoChunks, { type: "video/webm" });
    videoChunks = [];

    pushVideoOntoStack(videoBlob);

    storeVideo(videoBlob);

    seedVideo(videoBlob);
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
    console.err("Error: ", event);
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

var showDownloadedVideo = function(torrent) {
  torrent.files[0].getBlobURL(function(error, blobURL) {
    remoteVideo.src = blobURL;
  });
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

  getRemoteVideoButton.addEventListener("click", function(event) {
    var magnetURI = inputMagnetLink.value;
    webTorrentClient.add(magnetURI, showDownloadedVideo);
  }, false);
};

var upgradeDatabase = function(event) {
  database = event.target.result;
  database.createObjectStore("videos");
};

var openCursorSuccess = function(event) {
  var cursor = event.target.result;

  if (cursor) {
    var videoBlob = cursor.value;
    pushVideoOntoStack(videoBlob);

    cursor.continue();
  }
};

var setupDatabase = function() {
  var databaseName = "videos";
  var databaseVersion = 3;
  var databaseRequest = indexedDB.open(databaseName, databaseVersion);

  databaseRequest.onsuccess = function(event) {
    database = event.target.result;
    var objectStore = database.transaction("videos", "readwrite").objectStore("videos");

    objectStore.openCursor().onsuccess = openCursorSuccess;
  };

  databaseRequest.onerror = function() {
    console.err("database access failed");
  };

  databaseRequest.onupgradeneeded = upgradeDatabase;
};

var setupWebTorrentClient = function() {
  webTorrentClient = new WebTorrent();
};

var init = function() {
  setupWebTorrentClient();
  setupDatabase();
  navigator.mediaDevices.enumerateDevices().then(devicesCallback);
  addButtonListeners();
};

init();
