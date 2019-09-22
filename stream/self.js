const cameras = document.getElementsByClassName('camera')

const clientWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
const clientHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

/* reload page to stop it from breaking :---) */
setInterval(() => {
  location.reload(true)
}, 1000 * 60 * 60)

/* detection variables */
let network

const imageScaleFactor = 0.2
const flipHorizontal = true
const outputStride = 32
const minPartConfidence = 0.1

/* available devices log */
navigator.mediaDevices.enumerateDevices()
  .then((devices) => {
    const inputs = devices.filter((device) => device.kind === 'videoinput' && !device.label.includes('FaceTime'))

    if (inputs.length === 0) {
      return console.log('%cno USB cameras detected', 'padding: 5px; background: red; color: white;')
    }

    Array.prototype.forEach.call(cameras, (camera, index) => {
      if (!inputs[index]) console.log('%cNo camera found, provide enough for all .camera elements', 'padding: 5px; background: red; color: white;')
      console.log(`%cStreaming ${ inputs[index].label }`, 'padding: 5px; background: blue; color: white;')
      stream(camera, inputs[index].deviceId, true)
    })
  })
  .catch((error) => console.warn(error))

/* stream multiple devices */
function stream (camera, cameraDeviceId, detection = false) {
  navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 650 }, height: { ideal: 650 }, deviceId: { exact: cameraDeviceId } } })
    .then(stream => {
      camera.srcObject = stream
      camera.play()
    })
    .catch((error) => console.log(error))

  camera.addEventListener('loadeddata', (event) => {
    if (detection) {
      detect(camera)
    }
  })
}

/* pose detection */
async function detect (camera) {
  await posenet.load()
    .then((net) => {
      network = net
      poseDetectionFrame(camera)
    })
}

async function poseDetectionFrame (camera) {
  const pose = await network.estimateSinglePose(camera, imageScaleFactor, flipHorizontal, outputStride)

  repositionCamera(camera, pose.keypoints, minPartConfidence)

  requestAnimationFrame(() => {
    poseDetectionFrame(camera)
  })
}

function repositionCamera (camera, keypoints, minConfidence) {
  const keypoint = keypoints[0]

  if (keypoint.score < minConfidence) {
    camera.style.opacity = '0'
  } else {
    camera.style.opacity = null
  }

  const { y, x } = keypoint.position
  const correctedX = (x - camera.width / 2) * -1 + ((clientWidth / 2) - camera.width / 2)
  const correctedY = (y - camera.height / 2) * -1 + ((clientHeight / 2) - camera.height / 2)

  camera.style.transform = `translate( ${ correctedX }px, ${ correctedY }px)`
}

function drawKeypoints (keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i <= 4; i++) {
    const keypoint = keypoints[i]

    if (keypoint.score < minConfidence) {
      continue
    }

    const { y, x } = keypoint.position
    ctx.beginPath()
    ctx.arc(x * scale, y * scale, 2, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fill()
  }
}