chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getSummary') {
      const videoUrl = request.videoUrl;
  
      // Send video URL to the backend for processing
      fetch('http://localhost:3001/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      })
      .then(response => response.json())
      .then(data => {
        const summary = data.summary;
        chrome.tabs.sendMessage(sender.tab.id, { action: 'displaySummary', summary });
      })
      .catch(error => console.error('Error fetching video summary:', error));
    }
  });
  