var deviceId = null;

var initialiseVideoStream = function(stream) {
  mediaStream = stream;

  var video = document.getElementById("previewVideo");
  video.src = URL.createObjectURL(mediaStream);
};

var videoConstraints = {
  video : {
    width: 1280,
    height: 720,
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

var init = function() {
  navigator.mediaDevices.enumerateDevices().then(devicesCallback);
};

init();
