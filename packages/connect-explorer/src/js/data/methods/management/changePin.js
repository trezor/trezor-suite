/* @flow */

const name = 'changePin';
const docs = 'methods/changePin.md';

export default [
    {
        url: '/method/changePin',
        name,
        // docs,
        submitButton: 'Change PIN',
        fields: [{
            label: 'remove',
            name: 'remove',
            type: 'checkbox',
            optional: true,
            defaultValue: false,
            value: false,
        }]
    },
]