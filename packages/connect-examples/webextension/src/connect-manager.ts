// This JavaScript code is running in the connect-manager.html tab of the webextension
// and it communicates with the service worker when it needs something from Trezor device.
// There are different ways to achieve message passing from the tab with the service-worker,
// for more info: https://developer.chrome.com/docs/extensions/develop/concepts/messaging

const result = document.getElementById('result');
const getAddress = document.getElementById('get-address');
if (getAddress) {
    getAddress.addEventListener('click', () => {
        // Send a message to the background script (service worker) with the action 'getAddress'
        chrome.runtime.sendMessage({ action: 'getAddress' }, response => {
            // Check if the response indicates success

            if (response.success) {
                console.info(response); // Log the successful response to the console
                // Display the response in the 'result' element on the page
                if (result) {
                    result.innerText = JSON.stringify(response);
                }
            } else {
                console.error(response); // Log the error response to the console
                // Display an error message in the 'result' element on the page
                if (result) {
                    result.innerText = 'Error: ' + response.error;
                }
            }
        });
    });
}

const getFeatures = document.getElementById('get-features');
if (getFeatures) {
    getFeatures.addEventListener('click', () => {
        // Send a message to the background script (service worker) with the action 'getFeatures'
        chrome.runtime.sendMessage({ action: 'getFeatures' }, response => {
            // Check if the response indicates success
            if (response.success) {
                console.info(response); // Log the successful response to the console
                // Display the response in the 'result' element on the page
                if (result) {
                    result.innerText = JSON.stringify(response);
                }
            } else {
                console.error(response); // Log the error response to the console
                // Display an error message in the 'result' element on the page
                if (result) {
                    result.innerText = 'Error: ' + response.error;
                }
            }
        });
    });
}
