/* html element variables */
const cameraFrontDeviceId = '0f08c9UOp2wQ8tQSRfkVsTRLYFus4f+KiA++Lv8i3Rg='
const cameraLeftDeviceId = '401c6c3596eccafb6d8c2906ac76567929b3261487c9b5c885dc9c05d210c469'
const cameraRightDeviceId = '344051993c9332ed0f8d1a31f73016599baf95e5cca3010b41615c790294bd37'

/* const cameraFrontDeviceId = '401c6c3596eccafb6d8c2906ac76567929b3261487c9b5c885dc9c05d210c469'
const cameraLeftDeviceId = '344051993c9332ed0f8d1a31f73016599baf95e5cca3010b41615c790294bd37'
const cameraRightDeviceId = '54e3c96e7bbe589b387da64d234d512df83e93c096bcf991598dcae99cb649f7' */

const cameraFront = document.getElementById('camera-front')
const cameraLeft = document.getElementById('camera-left')
const cameraRight = document.getElementById('camera-right')
const cameraFrontCanvas = document.getElementById('camera-front-canvas')
const cameraFrontCanvasCtx = cameraFrontCanvas.getContext('2d')

/* detection variables */
let network
let poses = []

const imageScaleFactor = 0.2
const flipHorizontal = true
const outputStride = 32
const minPartConfidence = 0.1

/* available devices log */
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    devices.forEach(function(device) {
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

stream(cameraFront, cameraFrontDeviceId, true)
//stream(cameraLeft, cameraLeftDeviceId, true)
//stream(cameraRight, cameraRightDeviceId, true)

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
  poses.push(pose)
  // console.table(poses)

  // cameraFrontCanvasCtx.clearRect(0, 0, cameraFrontCanvas.width, cameraFrontCanvas.height)
  // drawKeypoints(poses[poses.length - 1].keypoints, minPartConfidence, cameraFrontCanvasCtx)
  repositionCamera(camera, poses[poses.length - 1].keypoints, minPartConfidence)

  requestAnimationFrame(() => {
    poseDetectionFrame(camera)
  })
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