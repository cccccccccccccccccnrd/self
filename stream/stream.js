const socket = new WebSocket('ws://localhost:1717')

const cameraFrontDeviceId = '9a26207fa19a3e90ce766af1cca4ae5ce6b99f8d5179fffcad9e107c13c5dc0b'
const cameraLeftDeviceId = '401c6c3596eccafb6d8c2906ac76567929b3261487c9b5c885dc9c05d210c469'
const cameraRightDeviceId = '344051993c9332ed0f8d1a31f73016599baf95e5cca3010b41615c790294bd37'

const cameraFront = document.getElementById('camera-front')
const cameraLeft = document.getElementById('camera-left')
const cameraRight = document.getElementById('camera-right')
const cameraFrontCanvas = document.getElementById('camera-front-canvas')
const cameraFrontCanvasCtx = cameraFrontCanvas.getContext('2d')

let network

const imageScaleFactor = 0.2
const flipHorizontal = true
const outputStride = 32
const minPartConfidence = 0.1

stream(cameraFront, cameraFrontDeviceId, true)
//stream(cameraLeft, cameraLeftDeviceId, true)
//stream(cameraRight, cameraRightDeviceId, true)

/* available devices log */
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    devices.forEach(device => {
      console.log(device.kind + ': ' + device.label + ' id = ' + device.deviceId)
    })
  })
  .catch(err => console.log(err.name + ': ' + err.message))

/* stream multiple devices */
function stream (camera, cameraDeviceId, detection = false) {
  navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 1280 }, height: { ideal: 720 }, deviceId: { exact: cameraDeviceId } } })
    .then(stream => {
      camera.srcObject = stream
      camera.play()
    })
    .catch(err => console.log(err.name + ': ' + err.message))

  if (detection) {
    detect(camera)
  }
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

  repositionCamera(camera, pose.keypoints, minPartConfidence)

  requestAnimationFrame(() => {
    poseDetectionFrame(camera)
  })
}

/* synchronizing camera */
function repositionCamera (camera, keypoints, minConfidence) {
  const keypoint = keypoints[0]

  if (keypoint.score < minConfidence) {
    camera.style.opacity = '0'
  } else {
    camera.style.opacity = null
  }

  const { y, x } = keypoint.position
  const correctedX = x - camera.width / 2
  const correctedY = (y - camera.height / 2) * -1

  camera.style.transform = 'translate(' + correctedX + 'px, ' + correctedY + 'px)'
}