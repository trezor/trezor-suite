/*
 * This entry is only used for Vite dev server!
 */

const observer = new MutationObserver(() => {
    const appElement = document.getElementById('app');
    if (appElement) {
        observer.disconnect();

        import('../MainWeb').then(comp => comp.init(appElement)).catch(err => console.error(err)); // Fatal error
    }
});

observer.observe(document.body, {
    childList: true,
});

export {};
