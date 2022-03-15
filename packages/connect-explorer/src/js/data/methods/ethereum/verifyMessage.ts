import { select } from './common';

export default [
    {
        url: '/method/ethereumVerifyMessage',
        name: 'ethereumVerifyMessage',
        docs: 'methods/ethereumVerifyMessage.md',
        submitButton: 'Verify message',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'eth',
                data: select,
            },
            // note that this values are valid for the "all" seed
            {
                name: 'address',
                type: 'input-long',
                value: '0xdA0b608bdb1a4A154325C854607c68950b4F1a34',
            },
            {
                name: 'message',
                type: 'textarea',
                value: 'Example message',
            },
            {
                name: 'signature',
                type: 'textarea',
                value: '11dc86c631ef5d9388c5e245501d571b864af1a717cbbb3ca1f6dacbf330742957242aa52b36bbe7bb46dce6ff0ead0548cc5a5ce76d0aaed166fd40cb3fc6e51c',
            },
            {
                name: 'hex',
                label: 'Convert message from hex',
                type: 'checkbox',
                optional: true,
                defaultValue: false,
                value: false,
            },
        ],
    },
];
