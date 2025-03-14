import { init } from './MainDesktop';

window.onload = () => {
    const appElement = document.getElementById('app');
    if (appElement) {
        init(appElement);
    }
};
