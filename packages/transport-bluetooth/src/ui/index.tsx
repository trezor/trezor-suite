// eslint-disable-next-line import/no-extraneous-dependencies
import { createRoot } from 'react-dom/client';

import { App } from './app';

const mountId = 'trezor-bluetooth-app-root';

function mountApp() {
    let mountNode = document.getElementById(mountId);
    if (!mountNode) {
        mountNode = document.createElement('div');
        mountNode.id = mountId;
        // document.body may not exist if script runs in head; fall back to document.documentElement
        const parent = document.body || document.documentElement;
        parent.appendChild(mountNode);
    }

    const root = createRoot(mountNode);
    root.render(<App />);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    mountApp();
} else {
    window.addEventListener('DOMContentLoaded', mountApp, { once: true });
}
