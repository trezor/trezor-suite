/*
 * This entry is only used for Vite dev server!
 */

const observer = new MutationObserver(() => {
    const appElement = document.getElementById('app');
    if (appElement) {
        observer.disconnect();

        import('../createSuiteWebCompositionRoot')
            .then(({ createSuiteWebCompositionRoot }) => {
                const { app } = createSuiteWebCompositionRoot();

                return app(appElement);
            })
            .catch(err => console.error(err)); // Fatal error
    }
});

observer.observe(document.body, {
    childList: true,
});

export {};
