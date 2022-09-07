// initialize worker
// expose messages from worker
// create TrezorConnect api proxy for sending messages to worker

import TrezorConnect, { DEVICE_EVENT } from './window-to-worker';

// @ts-ignore
window.getAddress = async () => {
    const result = await TrezorConnect.getAddress({ path: '1' });
    document.getElementById('result')!.innerHTML = JSON.stringify(result);
};

// @ts-ignore
window.getFeatures = async () => {
    const result = await TrezorConnect.getFeatures();
    document.getElementById('result')!.innerHTML = JSON.stringify(result);
};

TrezorConnect.init({
    manifest: {
        email: 'foo@bar',
        appUrl: 'meow-bar.com',
    },
});

console.log(TrezorConnect);

TrezorConnect.on(DEVICE_EVENT, event => {
    document.getElementById('events')!.innerHTML = JSON.stringify(event);
});
