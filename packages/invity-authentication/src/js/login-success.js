window.top.postMessage(
    JSON.stringify({
        name: 'invity-authentication',
        action: 'login-successful',
    }),
    '*',
);
