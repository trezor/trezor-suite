import {
    type BridgeProtocolMessage,
    validateProtocolMessage,
} from '../src/utils/bridgeProtocolMessage';

type Fixture = {
    description: string;
    params: Parameters<typeof validateProtocolMessage>;
} & ({ result: BridgeProtocolMessage } | { throws: string });

const fixtures: Fixture[] = [
    {
        description: 'raw hex without a protocol envelope is rejected (legacy format dropped)',
        params: ['09AF', true],
        throws: 'Invalid BridgeProtocolMessage body',
    },
    {
        description: 'empty body with data=true',
        params: ['', true],
        throws: 'Invalid BridgeProtocolMessage body',
    },
    {
        description: 'empty body with data=false',
        params: ['', false],
        throws: 'Invalid BridgeProtocolMessage body',
    },
    {
        description: 'parsable and valid protocol message as a string',
        params: ['{"protocol":"v1","data":"123"}'],
        result: { protocol: 'v1', data: '123' },
    },
    {
        description: 'parsable and invalid protocol message as a string',
        params: ['{"protocol":"v1","data":123}'],
        throws: 'Invalid BridgeProtocolMessage data',
    },
    {
        description: 'parsable but with invalid protocol',
        params: ['{"protocol":"foo-bar","data":"123"}'],
        throws: 'Invalid BridgeProtocolMessage protocol',
    },
    {
        description: 'not-parsable protocol message as a string',
        params: ['{}}{{"protocol":"v1","data":""}'],
        throws: 'Invalid BridgeProtocolMessage body',
    },
    {
        description: 'object with valid protocol message',
        params: [{ protocol: 'v1', data: '123' }],
        result: { protocol: 'v1', data: '123' },
    },
    {
        description: 'object with invalid protocol message',
        params: [{ protocol: 'foo-bar', data: '123' }],
        throws: 'Invalid BridgeProtocolMessage protocol',
    },
];

describe('bridgeProtocolMessage', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            if ('throws' in f) {
                expect(() => validateProtocolMessage(...f.params)).toThrow(f.throws);
            } else {
                expect(validateProtocolMessage(...f.params)).toEqual(f.result);
            }
        });
    });
});
