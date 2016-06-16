var deviceId = null;
var video = document.getElementById("video");
var button = document.getElementById("button");
var canvas = document.getElementById("canvas");
var img = document.getElementById("img");
var width = 400;
var height = 300;

var initialiseVideoStream = function(stream) {
  var mediaStream = stream;

  var video = document.getElementById("video");
  video.src = URL.createObjectURL(mediaStream);
};

var videoConstraints = {
  video : {
    width: width,
    height: height,
    deviceId: deviceId
  }
};

var nextWebCam = function() {
  console.log(navigator.webkitGetUserMedia);

  navigator.webkitGetUserMedia(
    videoConstraints,
    initialiseVideoStream,
    function(err) { console.log(err); }
  );
};

var devicesCallback = function(devices) {
  var device = devices[0];
  deviceId = device.deviceId;

  nextWebCam();
};

var setupCanvas = function() {
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
};

var takeAPicture = function() {
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, width, height);

  var data = canvas.toDataURL("image/png");
  img.setAttribute("src", data);
};

var addButtonListener = function() {
  button.addEventListener("click", function(event) {
    takeAPicture();
    event.preventDefault();
  }, false);
};

var clearImage = function() {
  var context = canvas.getContext("2d");
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas.width, canvas.height);

  var data = canvas.toDataURL("image/png");
  img.setAttribute("src", data);
};

var init = function() {
  setupCanvas();
  clearImage();
  navigator.mediaDevices.enumerateDevices().then(devicesCallback);
  addButtonListener();
};

init();
