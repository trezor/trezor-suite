document.addEventListener('DOMContentLoaded', () => {
    const newTabButton = document.getElementById('tab');
    if (newTabButton) {
        newTabButton.addEventListener('click', () => {
            chrome.tabs.create({ url: 'connect-manager.html' });
        });
    }
});
