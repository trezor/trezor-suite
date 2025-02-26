import { init } from '@trezor/suite-web/src/Main';

const appElement = document.getElementById('app');
if (appElement) {
    init(appElement);
}
export {};
