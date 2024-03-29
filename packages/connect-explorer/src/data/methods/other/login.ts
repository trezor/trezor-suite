const name = 'requestLogin';
const docs = 'methods/requestLogin.md';

export default [
    {
        url: '/method/requestLogin-sync',
        name,
        docs,
        submitButton: 'Login',
        fields: [
            {
                name: 'challengeHidden',
                type: 'input-long',
                value: '0123456789abcdef',
            },
            {
                name: 'challengeVisual',
                type: 'input-long',
                value: 'Login to',
            },
        ],
    },
    {
        url: '/method/requestLogin-async',
        name,
        docs,
        submitButton: 'Login',
        fields: [
            {
                name: 'callback',
                type: 'function',
                value() {
                    return new Promise(resolve => {
                        // wait 3 sec. and resolve
                        setTimeout(() => {
                            resolve({
                                challengeHidden: '0123456789abcdef',
                                challengeVisual: 'Login to',
                            });
                        }, 3000);
                    });
                },
            },
        ],
    },
];
