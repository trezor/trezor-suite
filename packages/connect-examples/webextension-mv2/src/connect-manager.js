async function sendMessageToBackground(type, data = null) {
    try {
        const response = await chrome.runtime.sendMessage({ type, data });
        return response;
    } catch (error) {
        console.error('sendMessageToBackground error: ', error);
        return null;
    }
}

const button = document.getElementById('get-address');
button.addEventListener('click', () => {
    sendMessageToBackground('getAddress');
});

chrome.runtime.onMessage.addListener((message, sender) => {
    const { type, data } = message;
    if (type === 'getAddress') {
        document.getElementById('result').innerText = JSON.stringify(data);
    } else if (type === 'connectLoaded') {
        const connectLoaded = document.createElement('div');
        connectLoaded.setAttribute('data-test-id', 'connect-loaded');
        connectLoaded.innerText = 'TrezorConnect is loaded';
        connectLoaded.style.display = 'block';
        document.body.appendChild(connectLoaded);
    }
});

// When page is loaded send message to background script to get reference so when
// TrezorConnect is loaded we know it and can call it.
sendMessageToBackground('pageLoaded');
