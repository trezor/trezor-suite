/*
 * On the start of the app, the index.html file is without div with id="app" to which React app should be rendered.
 * This div is added thanks to browser detection plugin in case that a user uses supported browser.
 * After the div is added, MutationObserver detects the change and adds React app to the DOM.
 */

import { init } from './Main';

const observer = new MutationObserver(() => {
    const appElement = document.getElementById('app');
    if (appElement) {
        observer.disconnect();
        init(appElement);
    }
});

observer.observe(document.body, {
    childList: true,
});

export {};
