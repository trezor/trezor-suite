const getAddressButton = document.getElementById('get-address');
if (getAddressButton) {
    getAddressButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'getAddress' }, response => {
            if (response.success) {
                console.info(response);
                const resultElement = document.getElementById('result');
                if (resultElement) {
                    resultElement.innerText = JSON.stringify(response);
                }
            } else {
                console.error(response);
                const resultElement = document.getElementById('result');
                if (resultElement) {
                    resultElement.innerText = 'Error: ' + response.error;
                }
            }
        });
    });
}

const getFeaturesButton = document.getElementById('get-features');
if (getFeaturesButton) {
    getFeaturesButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'getFeatures' }, response => {
            if (response.success) {
                console.info(response);
                const resultElement = document.getElementById('result');
                if (resultElement) {
                    resultElement.innerText = JSON.stringify(response);
                }
            } else {
                console.error(response);
                const resultElement = document.getElementById('result');
                if (resultElement) {
                    resultElement.innerText = 'Error: ' + response.error;
                }
            }
        });
    });
}
