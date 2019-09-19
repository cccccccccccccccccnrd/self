const socket = new WebSocket('ws://localhost:1717')

const cameras = [{
  position: 'front',
  deviceId: '9a26207fa19a3e90ce766af1cca4ae5ce6b99f8d5179fffcad9e107c13c5dc0b'
}, {
  position: 'left',
  deviceId: '9a26207fa19a3e90ce766af1cca4ae5ce6b99f8d5179fffcad9e107c13c5dc0b'
}, {
  position: 'right',
  deviceId: '9a26207fa19a3e90ce766af1cca4ae5ce6b99f8d5179fffcad9e107c13c5dc0b'
}]

let network

const imageScaleFactor = 0.2
const flipHorizontal = true
const outputStride = 32
const minPartConfidence = 0.1

init(1, false)

/* available devices log */
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    devices.forEach(device => {
      console.log(device.kind + ': ' + device.label + ' id = ' + device.deviceId)
    })
  })
  .catch(err => console.log(err.name + ': ' + err.message))

/* initializes video elements and stream */
function init (limit, detection = false) {
  cameras.slice(0, limit).forEach (camera => {
    const video = document.createElement('video')
    video.setAttribute('id', camera.position)
    video.setAttribute('width', '1280')
    video.setAttribute('height', '720')
    document.body.appendChild(video)

    stream(video, camera.deviceId, detection)
  })
}

/* stream multiple devices */
function stream (camera, cameraDeviceId, detection = false) {
  navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 1280 }, height: { ideal: 720 }, deviceId: { exact: cameraDeviceId } } })
    .then(stream => {
      camera.srcObject = stream
      camera.play()
    })
    .catch(err => console.log(err.name + ': ' + err.message))

  if (detection) detect(camera)
}

/* pose detection */
async function detect (camera) {
  await posenet.load()
    .then(net => {
      network = net
      poseDetectionFrame(camera)
    })
}

async function poseDetectionFrame (camera) {
  const pose = await network.estimateSinglePose(camera, imageScaleFactor, flipHorizontal, outputStride)

  if (socket.readyState == 1) socket.send(JSON.stringify(pose))

  repositionCamera(camera, pose.keypoints)

  requestAnimationFrame(() => {
    poseDetectionFrame(camera)
  })
}

/* synchronizing camera */
function repositionCamera (camera, keypoints) {
  const keypoint = keypoints[0]

  if (keypoint.score < minPartConfidence) {
    camera.style.opacity = '0'
  } else {
    camera.style.opacity = null
  }

  const { y, x } = keypoint.position
  const correctedX = x - camera.width / 2
  const correctedY = (y - camera.height / 2) * -1

  camera.style.transform = 'translate(' + correctedX + 'px, ' + correctedY + 'px)'
}