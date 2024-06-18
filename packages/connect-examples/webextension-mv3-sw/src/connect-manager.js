document.getElementById('get-address').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getAddress' }, response => {
        if (response.success) {
            console.info(response);
            document.getElementById('result').innerText = JSON.stringify(response);
        } else {
            console.error(response);
            document.getElementById('result').innerText = 'Error: ' + response.error;
        }
    });
});

document.getElementById('get-features').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getFeatures' }, response => {
        if (response.success) {
            console.info(response);
            document.getElementById('result').innerText = JSON.stringify(response);
        } else {
            console.error(response);
            document.getElementById('result').innerText = 'Error: ' + response.error;
        }
    });
});
