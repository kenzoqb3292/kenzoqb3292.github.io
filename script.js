const video = document.getElementById('video')
const btnStart = document.getElementById('btnStart')
const modal = document.getElementById("modalResult")
const modalResultBody = document.getElementById("modalResultBody")
//var labeledFaceDescriptors = new faceapi.LabeledFaceDescriptors()


Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
]).then(startVideo)

window.onload = function () {
  btnStart.addEventListener('click', startRecognize);
}


const constraints = window.constraints = {
  audio: false,
  video: true
};
function startVideo() {
  // navigator.getUserMedia(
  //   { video: {} },
  //   stream => video.srcObject = stream,
  //   err => console.error(err)
  // )

  var errBack = function (e) {
    console.log('An error has occurred!', e)
  };

  // Put video listeners into place
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      //video.src = window.URL.createObjectURL(stream);
      window.stream = stream; // make variable available to browser console
      video.srcObject = stream;
      video.play();
    });
  }

  /* Legacy code below! */
  else if (navigator.getUserMedia) { // Standard
    navigator.getUserMedia(constraints, function (stream) {
      video.src = stream;
      video.play();
    }, errBack);
  } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
    navigator.webkitGetUserMedia(constraints, function (stream) {
      video.src = window.webkitURL.createObjectURL(stream);
      video.play();
    }, errBack);
  } else if (navigator.mozGetUserMedia) { // Mozilla-prefixed
    navigator.mozGetUserMedia(constraints, function (stream) {
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }, errBack);
  }
}

function startRecognize() {
  btnStart.disabled = true
  const canvas = faceapi.createCanvasFromMedia(video)
  document.getElementById('frame').append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)

  // if(!labeledFaceDescriptors){
  //   labeledFaceDescriptors = (async () => {
  //     labeledFaceDescriptors = await loadLabeledImages()
  //   })()
  // }
  let labeledFaceDescriptors
  (async () => {
    labeledFaceDescriptors = await loadLabeledImages()
  })()

  let i = 0
  let handle = setInterval(async () => {
    i++
    // set timeout 30s
    if (i > 30) {
      modalResultBody.innerText = ' Kh??ng th??? x??c ?????nh ???????c khu??n m???t, vui l??ng nh??n th???ng v??o camera, v?? th??? thay ?????i kho???ng c??ch ?????n camera r???i nh???n n??t Recognize ????? th??? l???i . '
      modal.style.display = 'block'
      clearInterval(handle)
      handle = 0
    }
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

    if (labeledFaceDescriptors && handle != 0) {
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
      const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
      results.forEach((result, i) => {
        // const box = resizedDetections[i].detection.box
        // const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
        // drawBox.draw(canvas)
        if (result.label.toString() != 'unknown') {
          modalResultBody.innerText = result.label.toString() + ' ???? check in v??o l??c ' + new Date().toLocaleString()
          modal.style.display = 'block'
          clearInterval(handle)
          handle = 0
          btnStart.disabled = false
        }
      })
    }
  }, 1000)

}

function loadLabeledImages() {
  const labels = ['0338011257', '0905505296', '000000000001', '000000000002', '7209370845']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 1; i++) {
        const img = await faceapi.fetchImage(`https://kenzoqb3292.github.io/img/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}

function closeModal() {
  modal.style.display = 'none'
  btnStart.disabled = false
}
