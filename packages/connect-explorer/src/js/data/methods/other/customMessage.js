/* @flow */
import messages from './custom.messages';
import stringifyObject from 'stringify-object';

const name = 'customMessage';
const docs = 'methods/customMessage.md';

const defaultFn: string = `function (request) {
    if (request.type === 'StellarTxOpRequest') {
        return {
            message: 'StellarPaymentOp',
            params: { }
        }
    }
}`;

export default [
    {
        url: '/method/customMessage',
        name,
        // docs,
        submitButton: 'Call',
        fields: [
            {
                name: 'message',
                type: 'input-long',
                value: 'StellarSignTx',
            },
            {
                name: 'params',
                label: 'Message params',
                type: 'json',
                value: `{
    address_n: [2147483694, 2147483708, 2147483648],
    num_operations: 1
}`,
            },
            {
                name: 'callback',
                label: 'Request handler',
                type: 'function',
                value: defaultFn,
            },
            {
                name: 'messages',
                label: 'Custom JSON with Messages definitions',
                type: 'json',
                value: stringifyObject(messages),
            },
        ]
    },
]