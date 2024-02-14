document.addEventListener('DOMContentLoaded', function () {

  const getSummaryButton = document.getElementById('getSummary');
  const videoUrlInput = document.getElementById('videoUrl');
  const summaryDiv = document.getElementById('summary');

  getSummaryButton.addEventListener('click', function () {
    const videoUrl = videoUrlInput.value;
    if (videoUrl) {
      alert("Fetching video details..."+videoUrl);
      getVideoDetails(videoUrl);
    } else {
      console.error("Error: videoUrl is empty or undefined.");
    }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    alert("Received message..."+request.action);
    if (request.action === 'displaySummary') {
      alert("Displaying summary..."+request.summary);
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
      alert("Title:"+title);
      alert("Summary:"+summary);
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
