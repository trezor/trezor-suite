const name = 'requestLogin';

export default [
    {
        name,
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
        name,
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
