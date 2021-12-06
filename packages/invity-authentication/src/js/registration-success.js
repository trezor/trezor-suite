window.top.postMessage(
    JSON.stringify({
        name: 'invity-authentication',
        state: 'registration-successful',
    }),
    '*',
);
