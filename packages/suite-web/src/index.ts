// @ts-ignore - Export not needed
const observer = new MutationObserver(() => {
    const appElement = document.getElementById('app');
    if (appElement) {
        observer.disconnect();

        Promise.all([
            import(/* webpackChunkName: "react-dom" */ 'react-dom'),
            import(/* webpackChunkName: "app" */ './Main'),
        ])
            .then(([rd, comp]) => {
                rd.render(comp.default, appElement);
            })
            .catch(err => {
                // Fatal error
                console.log(err);
            });
    }
});

observer.observe(document.body, {
    childList: true,
});
