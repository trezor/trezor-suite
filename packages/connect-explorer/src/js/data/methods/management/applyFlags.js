/* @flow */

const name = 'applyFlags';
const docs = 'methods/applyFlags.md';

export default [
    {
        url: '/method/applyFlags',
        name,
        // docs,
        submitButton: 'Apply flags',
        fields: [
            {
                name: 'flags',
                type: 'number',
                optional: false,
                value: '',
            },
        ]
    },
]