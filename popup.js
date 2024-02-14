document.addEventListener('DOMContentLoaded', async function () {
  const getSummaryButton = document.getElementById('getSummary');
  const videoUrlInput = document.getElementById('videoUrl');
  const summaryDiv = document.getElementById('summary');

  getSummaryButton.addEventListener('click', function () {
    const videoUrl = videoUrlInput.value;
    if (videoUrl) {
      console.log("Fetching video details..." + videoUrl);
      getVideoDetails(videoUrl);
    } else {
      console.error("Error: videoUrl is empty or undefined.");
    }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Received message..." + request.action);
    if (request.action === 'displaySummary') {
      console.log("Displaying summary..." + request.summary);
      summaryDiv.innerText = request.summary;
    }
  });
  async function convertToVideo(summaryText, imageUrl) {
    try {
      const ffmpeg = createFFmpeg({ log: true });
      console.log(typeof ffmpeg); // Should output "function" if createFFmpeg is defined
      // Load FFmpeg
      await ffmpeg.load();

      // Once FFmpeg is loaded, you can use the ffmpeg variable safely
      const thumbnailBuffer = await fetch(imageUrl).then(response => response.arrayBuffer());
      await ffmpeg.FS('writeFile', imageUrl, new Uint8Array(thumbnailBuffer));
      const summary = summaryText;
      console.log("Summary:", summary);
      const audioBuffer = await generateAudio(summary);
      await ffmpeg.FS('writeFile', 'audio.mp3', new Uint8Array(audioBuffer));

      await ffmpeg.run('-i', imageUrl, '-i', 'audio.mp3', '-c:v', 'libx264', '-c:a', 'aac', '-strict', 'experimental', 'output_video.mp4');

      const outputVideoData = await ffmpeg.FS('readFile', 'output_video.mp4');
      console.log("Output video data:", outputVideoData);
      const outputVideoBlob = new Blob([outputVideoData.buffer], { type: 'video/mp4' });

      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(outputVideoBlob);
      downloadLink.download = 'output_video.mp4';
      downloadLink.textContent = 'Download Video';

      document.body.appendChild(downloadLink);
    } catch (error) {
      console.error("Error converting to video:", error);
    }
  }

  async function getVideoDetails(videoUrl) {
    const videoId = new URL(videoUrl).searchParams.get("v");
    const apiKey = "AIzaSyDt-UtSEUbp4dMPntz13QWjtrY6-MLxAB4";
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data.items.length > 0) {
        const videoTitle = data.items[0].snippet.title;
        const summary = data.items[0].snippet.description;
        const imageUrl = data.items[0].snippet.thumbnails.default.url;
        console.log("Image URL:", imageUrl);
        // console.log("Title:", videoTitle);
        // console.log("Summary:", summary);
        if (summary) {
          convertToVideo(summary, imageUrl);
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const activeTab = tabs[0];
          if (activeTab) {
            chrome.tabs.sendMessage(activeTab.id, { action: 'displaySummary', summary });
          } else {
            console.error("Error: No active tab found.");
          }
        });
      } else {
        console.error('Video not found.');
      }
    } catch (error) {
      console.error("Error fetching video details:", error);
    }
  }



  async function generateAudio(text) {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        const audioContext = new AudioContext();
        const audioBuffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        source.connect(audioContext.destination);
        source.onended = () => {
          const arrayBuffer = audioBuffer.getChannelData(0).buffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(uint8Array);
        };

        source.start();
      };

      utterance.onerror = (error) => {
        reject(error);
      };

      speechSynthesis.speak(utterance);
    });
  }

});

