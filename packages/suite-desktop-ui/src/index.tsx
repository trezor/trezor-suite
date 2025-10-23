import { init } from './MainDesktop';

__webpack_nonce__ = window.cspNonce;

window.onload = () => {
    const appElement = document.getElementById('app');
    if (appElement) {
        init(appElement);
    }
};
