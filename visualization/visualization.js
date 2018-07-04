const socket = new WebSocket('ws://localhost:1717')
const canvas = document.getElementById('visualization')
const canvasCtx = canvas.getContext('2d')

let pose, poses = [], keys = []

/* websocket handeling */
socket.addEventListener('message', event => {
  pose = JSON.parse(event.data)
  poses.push(pose)
  visualize(pose.keypoints, canvasCtx)
})

/* drawing data onto canvas */
function visualize (keypoints, ctx, scale = 1) {
  for (let i = 0; i <= 0; i++) {
    const keypoint = keypoints[i]

    if (keypoint.score < 0.1) {
      continue
    }

    const { y, x } = keypoint.position
    ctx.beginPath()
    ctx.arc(x * scale, y * scale, 1, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgb(255, 0, 0)'
    ctx.fill()
  }
}

/* clear canvas and optionally extract poses as data and visualization */
function restart (extract = false) {
  if (extract) extractPoses()

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
  poses = []
}

function extractPoses () {
  let timestamp = Date.now()

  let aVisualization = document.createElement('a')
  let image = canvas.toDataURL("image/png")
  aVisualization.href = image
  aVisualization.download = timestamp + '-visualization.png'
  aVisualization.click()

  let aData = document.createElement('a')
  let file = new Blob([JSON.stringify(poses)], { type: 'text/plain' })
  aData.href = URL.createObjectURL(file)
  aData.download = timestamp + '-data.txt'
  aData.click()
}

document.onkeydown = document.onkeyup = (event) => {
  keys[event.keyCode] = event.type == 'keydown'

  if (keys[82] && keys[69]) {
    restart(true) 
  } else if (keys[82]) {
    restart()
  }
}