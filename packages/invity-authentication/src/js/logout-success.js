window.top.postMessage(
    JSON.stringify({
        name: 'invity-authentication',
        state: 'logout-successful',
    }),
    '*',
);
