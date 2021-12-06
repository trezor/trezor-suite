window.top.postMessage(
    JSON.stringify({
        name: 'invity-authentication',
        state: 'login-successful',
    }),
    '*',
);
