const newTabButton = document.getElementById('tab');
newTabButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'connect-manager.html' });
});
