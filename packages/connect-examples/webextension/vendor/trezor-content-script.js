(() => {
    let e = chrome.runtime.connect({ name: 'trezor-connect' });
    e.onMessage.addListener(e => {
        window.postMessage(e, window.location.origin);
    }),
        window.addEventListener('message', n => {
            e && n.source === window && n.data && e.postMessage({ data: n.data });
        });
})();
