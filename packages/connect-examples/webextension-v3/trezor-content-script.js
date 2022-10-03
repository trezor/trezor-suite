// chrome.runtime.onMessage(event => {
//     console.log('chrome.runtime.onMessage event', event);
// });

console.log('content script registered');

// chrome.runtime.sendMessage(undefined, { message: 'meow' });

chrome.runtime.onMessage.addListener(event => {
    console.log('message', event);
    document.getElementsByTagName('body')[0].innerHTML = JSON.stringify(event);
    // document.getElementsByTagName('body')[0].innerHTML = JSON.stringify(event);
    chrome.ex;
    return true;
});

(() => {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    /**
     * Given a URL to a beast image, remove all existing beasts, then
     * create and style an IMG node pointing to
     * that image, then insert the node into the document.
     */
    function insertBeast(beastURL) {
        removeExistingBeasts();
        const beastImage = document.createElement('img');
        beastImage.setAttribute('src', beastURL);
        beastImage.style.height = '100vh';
        beastImage.className = 'beastify-image';
        document.body.appendChild(beastImage);
    }

    /**
     * Remove every beast from the page.
     */
    function removeExistingBeasts() {
        const existingBeasts = document.querySelectorAll('.beastify-image');
        for (const beast of existingBeasts) {
            beast.remove();
        }
    }

    /**
     * Listen for messages from the background script.
     * Call "insertBeast()" or "removeExistingBeasts()".
     */
    browser.runtime.onMessage.addListener(message => {
        if (message.command === 'beastify') {
            insertBeast(message.beastURL);
        } else if (message.command === 'reset') {
            removeExistingBeasts();
        }
    });
})();
