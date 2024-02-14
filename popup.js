document.addEventListener('DOMContentLoaded', function () {
  
    const getSummaryButton = document.getElementById('getSummary');
    const videoUrlInput = document.getElementById('videoUrl');
    const summaryDiv = document.getElementById('summary');
  
    getSummaryButton.addEventListener('click', function () { 
      const videoUrl = videoUrlInput.value;
      alert(videoUrl)
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) { alert("hello 0",tabs[0].id,videoUrl)
        const activeTab = tabs[0];alert("hello 1",activeTab.id,videoUrl)
        if (activeTab) {
          alert("Hello 1", activeTab.id, videoUrl);
          chrome.tabs.sendMessage(activeTab.id, { action: 'getSummary', videoUrl }, function (response) {
            alert("Hello 2", response);
          });
        } else {
          alert("error")
          console.error("Error: No active tab found.");
        }
        // chrome.tabs.sendMessage(activeTab.id, { action: 'getSummary', videoUrl });alert("hello 2",videoUrl)
      });
    });
  
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { alert("hello")
      if (request.action === 'displaySummary') { alert(request.summary)
        summaryDiv.innerText = request.summary;
      }
    });
  });
  