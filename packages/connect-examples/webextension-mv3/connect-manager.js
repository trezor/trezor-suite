window.TrezorConnect.init({
    lazyLoad: true,
    manifest: {
        email: 'developer@xyz.com',
        appUrl: 'http://your.application.com',
    },
});

const getAddressButton = document.getElementById('get-address');
getAddressButton.addEventListener('click', () => {
    window.TrezorConnect.getAddress({
        showOnTrezor: true,
        path: "m/49'/0'/0'/0/0",
        coin: 'btc',
    }).then(res => {
        console.info(res);
        document.getElementById('result').innerText = JSON.stringify(res);
    });
});

const getFeaturesButton = document.getElementById('get-features');
getFeaturesButton.addEventListener('click', () => {
    window.TrezorConnect.getFeatures().then(res => {
        console.info(res);
        document.getElementById('result').innerText = JSON.stringify(res);
    });
});

const newTabButton = document.getElementById('tab');
newTabButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'connect-manager.html' });
});
