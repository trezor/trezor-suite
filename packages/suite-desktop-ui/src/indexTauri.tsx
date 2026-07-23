// WKWebView (Safari engine) lacks newer JS features that Electron's Chromium ships natively
// (e.g. DisposableStack / explicit resource management). Polyfill them like the web build does.
import 'core-js/actual';

import { init } from './MainTauri';

__webpack_nonce__ = window.cspNonce;

window.onload = () => {
    const appElement = document.getElementById('app');
    if (appElement) {
        init(appElement);
    }
};
