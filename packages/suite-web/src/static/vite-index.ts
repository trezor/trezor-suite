/*
 * This entry is only used for Vite dev server!
 */

// Force @trezor/connect to load core from the same origin under Vite.
// Relative connectSrc ("../") breaks because the dynamic import resolves relative to a Vite /@fs module URL.
// @ts-expect-error not part of Window type
window.__TREZOR_CONNECT_SRC = `${window.location.origin}/`;

const appElement = document.getElementById('app');
if (appElement) {
    import('../MainWeb').then(comp => comp.init(appElement)).catch(err => console.error(err)); // Fatal error
}

export {};
