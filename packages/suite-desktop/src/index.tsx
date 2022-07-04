import { init } from './Main';

window.onload = () => {
    const appElement = document.getElementById('app');
    if (appElement) {
        init(appElement);
    }
};
