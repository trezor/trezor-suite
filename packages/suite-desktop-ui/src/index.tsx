import { createSuiteDesktopCompositionRoot } from './createSuiteDesktopCompositionRoot';

__webpack_nonce__ = window.cspNonce;

const { init } = createSuiteDesktopCompositionRoot();

window.onload = () => {
    const appElement = document.getElementById('app');
    if (appElement) {
        init(appElement);
    }
};
