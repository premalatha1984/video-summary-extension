document.addEventListener('DOMContentLoaded', function () {

  const getSummaryButton = document.getElementById('getSummary');
  const videoUrlInput = document.getElementById('videoUrl');
  const summaryDiv = document.getElementById('summary');

  getSummaryButton.addEventListener('click', function () {
    const videoUrl = videoUrlInput.value;
    if (videoUrl) {
      alert("Fetching video details..." + videoUrl);
      getVideoDetails(videoUrl);
    } else {
      console.error("Error: videoUrl is empty or undefined.");
    }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    alert("Received message..." + request.action);
    if (request.action === 'displaySummary') {
      alert("Displaying summary..." + request.summary);
      summaryDiv.innerText = request.summary;
    }
  });
});

function getVideoDetails(videoUrl) {
  const videoId = new URL(videoUrl).searchParams.get("v");
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=AIzaSyDt-UtSEUbp4dMPntz13QWjtrY6-MLxAB4`;
  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      const title = data.items[0].snippet.title;
      const summary = data.items[0].snippet.description;
      const imageurl = data.items[0].snippet.thumbnails.default.url;
      console.log("imageurl"+imageurl)
      alert("Title:" + title);
      alert("Summary:" + summary);
      if (summary) {
        // if ('speechSynthesis' in window) {
        //   speakText(summary);
        // } else {
        //   console.error('Speech synthesis not supported by the browser');
        // }
        convertToVideo(summary,imageurl)
      }
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        if (activeTab) {
          chrome.tabs.sendMessage(activeTab.id, { action: 'displaySummary', summary });
        } else {
          console.error("Error: No active tab found.");
        }
      });
    })
    .catch((error) => console.error("Error fetching video details:", error));
}


function speakText(text) {
  var msg = new SpeechSynthesisUtterance();
  msg.text = text;
  window.speechSynthesis.speak(msg);
}



async function convertToVideo(summaryText,imageUrl) {
  // Load the ffmpeg.wasm module
  // await FFmpeg.load();

  // Create an FFmpeg instance
  const ffmpeg = FFmpeg.createFFmpeg({ log: true });

  // Read the thumbnail image
  const thumbnailBuffer = await fetch(imageUrl).then(response => response.arrayBuffer());
  await ffmpeg.FS('writeFile', imageUrl, new Uint8Array(thumbnailBuffer));

  // Generate audio using text-to-speech (replace with your own TTS logic)
  const summary = summaryText;
  const audioBuffer = await generateAudio(summary);
  await ffmpeg.FS('writeFile', 'audio.mp3', new Uint8Array(audioBuffer));

  // Run FFmpeg commands to combine thumbnail and audio into a video
  await ffmpeg.run('-i', imageUrl, '-i', 'audio.mp3', '-c:v', 'libx264', '-c:a', 'aac', '-strict', 'experimental', 'output_video.mp4');

  // Retrieve the output video data
  const outputVideoData = await ffmpeg.FS('readFile', 'output_video.mp4');

  // Convert the Uint8Array to a Blob
  const outputVideoBlob = new Blob([outputVideoData.buffer], { type: 'video/mp4' });

  // Create a download link for the output video
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(outputVideoBlob);
  downloadLink.download = 'output_video.mp4';
  downloadLink.textContent = 'Download Video';
  console.log("downloadLink"+downloadLink)
  // Append the download link to the body
  document.body.appendChild(downloadLink);
}

async function generateAudio(text) {
  // Create a SpeechSynthesisUtterance object
  const utterance = new SpeechSynthesisUtterance(text);

  // Use the SpeechSynthesis API to convert text to speech
  return new Promise((resolve) => {
    utterance.onend = () => {
      const audioContext = new AudioContext();
      const audioBuffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      source.connect(audioContext.destination);
      source.onended = () => {
        // Convert the audio data to Uint8Array
        const arrayBuffer = audioBuffer.getChannelData(0).buffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };

      // Start playing the synthesized speech
      source.start();
    };

    speechSynthesis.speak(utterance);
  });
}
