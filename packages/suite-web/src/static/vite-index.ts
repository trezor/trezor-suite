/*
 * This entry is only used for Vite dev server!
 */

const appElement = document.getElementById('app');
if (appElement) {
    import('../Main').then(comp => comp.init(appElement)).catch(err => console.error(err)); // Fatal error
}

export {};
