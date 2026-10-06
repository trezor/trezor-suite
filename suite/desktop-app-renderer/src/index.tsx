import { createSuiteDesktopCompositionRoot } from './createSuiteDesktopCompositionRoot';

__webpack_nonce__ = window.cspNonce;

const { app } = createSuiteDesktopCompositionRoot();

window.onload = () => {
    const appElement = document.getElementById('app');
    if (appElement) {
        app(appElement);
    }
};
