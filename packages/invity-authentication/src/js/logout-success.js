window.top.postMessage(
    JSON.stringify({
        name: 'invity-authentication',
        action: 'logout-successful',
    }),
    '*',
);
