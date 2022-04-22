(() => {
    const e = `https://connect.trezor.io/${'8.2.8'.split('.').map(e => parseInt(e, 10))[0]}/`,
        t = s => {
            window.removeEventListener('beforeunload', t),
                s ||
                    chrome.tabs.query({ currentWindow: !0, active: !0 }, e => {
                        e.length < 0 || chrome.tabs.remove(e[0].id);
                    }),
                chrome.tabs.query({ url: `${e}popup.html` }, e => {
                    e.length < 0 || chrome.tabs.update(e[0].id, { active: !0 });
                });
        };
    window.addEventListener('message', e => {
        if ('usb-permissions-init' === e.data) {
            const e = document.getElementById('trezor-usb-permissions');
            if (!(e && e instanceof HTMLIFrameElement))
                throw new Error('trezor-usb-permissions missing or incorrect dom type');
            e.contentWindow.postMessage(
                { type: 'usb-permissions-init', extension: chrome.runtime.id },
                '*',
            );
        } else 'usb-permissions-close' === e.data && t();
    }),
        window.addEventListener('beforeunload', t),
        window.addEventListener('load', () => {
            const t = document.createElement('iframe');
            (t.id = 'trezor-usb-permissions'),
                (t.frameBorder = '0'),
                (t.width = '100%'),
                (t.height = '100%'),
                (t.style.border = '0px'),
                (t.style.width = '100%'),
                (t.style.height = '100%'),
                t.setAttribute('src', `${e}extension-permissions.html`),
                t.setAttribute('allow', 'usb'),
                document.body && document.body.appendChild(t);
        });
})();
