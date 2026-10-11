import type { Transaction } from '@trezor/blockchain-link-types';

export const filterTargets = [
    {
        description: 'addresses as string',
        addresses: 'A',
        targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
        parsed: [{ addresses: ['A'] }],
    },
    {
        description: 'addresses as array of strings',
        addresses: ['A'],
        targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
        parsed: [{ addresses: ['A'] }],
    },
    {
        description: 'addresses as array of mixed objects',
        addresses: ['A', 1, undefined, 'C', { address: 'B', path: '', transfers: 0, decimal: 0 }],
        targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
        parsed: [{ addresses: ['A'] }, { addresses: ['B'] }],
    },
    {
        description: 'targets not found',
        addresses: 'A',
        targets: [{ addresses: ['B'] }, { addresses: ['C'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (number)',
        addresses: 1,
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (null)',
        addresses: null,
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (array of numbers)',
        addresses: [1],
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (array of unexpected objects)',
        addresses: [{ foo: 'bar' }],
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'targets as unexpected object (string)',
        addresses: 'A',
        targets: 'A',
        parsed: [],
    },
    {
        description: 'targets as unexpected object (null)',
        addresses: 'A',
        targets: null,
        parsed: [],
    },
    {
        description: 'targets as unexpected object (array of unexpected objects)',
        addresses: 'A',
        targets: ['A', null, 1, {}],
        parsed: [],
    },
];

export const toAddressSet = [
    {
        description: 'addresses as string',
        addresses: 'A',
        parsed: ['A'],
    },
    {
        description: 'addresses as array of strings, deduplicated in order',
        addresses: ['A', 'B', 'A'],
        parsed: ['A', 'B'],
    },
    {
        description: 'addresses as array of mixed objects',
        addresses: ['A', 1, undefined, 'C', { address: 'B', path: '', transfers: 0, decimal: 0 }],
        parsed: ['A', 'C', 'B'],
    },
    {
        description: 'addresses as unexpected object (number)',
        addresses: 1,
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (null)',
        addresses: null,
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (array of numbers)',
        addresses: [1],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (array of unexpected objects)',
        addresses: [{ foo: 'bar' }],
        parsed: [],
    },
];

export const filterTargetsBySet = [
    {
        description: 'keeps the owned targets in their original order',
        addresses: ['A', 'C'],
        targets: [{ addresses: ['A'] }, { addresses: ['B'] }, { addresses: ['D', 'C'] }],
        parsed: [{ addresses: ['A'] }, { addresses: ['D', 'C'] }],
    },
    {
        description: 'targets not found',
        addresses: ['A'],
        targets: [{ addresses: ['B'] }, { addresses: ['C'] }],
        parsed: [],
    },
    {
        description: 'targets as unexpected object (string)',
        addresses: ['A'],
        targets: 'A',
        parsed: [],
    },
    {
        description: 'targets as unexpected object (null)',
        addresses: ['A'],
        targets: null,
        parsed: [],
    },
    {
        description: 'targets as unexpected object (array of unexpected objects)',
        addresses: ['A'],
        targets: ['A', null, 1, {}],
        parsed: [],
    },
];

export const isAccountOwned = [
    {
        description: 'owned when any of its addresses is in the index',
        addresses: ['A', 'B'],
        vinVout: { n: 0, isAddress: true, addresses: ['X', 'B'] },
        owned: true,
    },
    {
        description: 'not owned when none of its addresses is in the index',
        addresses: ['A', 'B'],
        vinVout: { n: 0, isAddress: true, addresses: ['X'] },
        owned: false,
    },
    {
        description: 'coinbase vin without addresses is not owned',
        addresses: ['A'],
        vinVout: { n: 0, isAddress: false, coinbase: '03a08b0d' },
        owned: false,
    },
    {
        description: 'addresses as unexpected object (string) are not owned',
        addresses: ['A'],
        vinVout: { n: 0, isAddress: true, addresses: 'A' },
        owned: false,
    },
    {
        description: 'vinVout as unexpected object (null) is not owned',
        addresses: ['A'],
        vinVout: null,
        owned: false,
    },
    {
        description: 'empty index owns nothing',
        addresses: [],
        vinVout: { n: 0, isAddress: true, addresses: ['A'] },
        owned: false,
    },
];

export const enhanceVinVout = [
    {
        description: 'marks an owned vout and keeps its fields',
        addresses: ['A'],
        vinVout: { n: 1, isAddress: true, addresses: ['A'], value: '50' },
        enhanced: { n: 1, isAddress: true, addresses: ['A'], value: '50', isAccountOwned: true },
    },
    {
        description: 'leaves isAccountOwned undefined on a foreign vout',
        addresses: ['A'],
        vinVout: { n: 1, isAddress: true, addresses: ['B'], value: '50' },
        enhanced: {
            n: 1,
            isAddress: true,
            addresses: ['B'],
            value: '50',
            isAccountOwned: undefined,
        },
    },
    {
        description: 'leaves isAccountOwned undefined on a coinbase vin',
        addresses: ['A'],
        vinVout: { n: 0, isAddress: false, coinbase: '03a08b0d' },
        enhanced: { n: 0, isAddress: false, coinbase: '03a08b0d', isAccountOwned: undefined },
    },
];

export const unsortedTxs = [
    { txid: 'e', blockHeight: 30, details: { vin: [{ txid: 'f' }, { txid: 'g' }] } },
    { txid: 'h', blockHeight: 20, details: { vin: [{ txid: 'e' }] } },
    { txid: 'c', blockHeight: 50, details: { vin: [{ txid: 'a' }] } },
    { txid: 'g', blockHeight: 30, details: { vin: [{ txid: 'b' }] } },
    { txid: 'a', blockHeight: -1, details: { vin: [] } },
    { txid: 'j', blockHeight: 10, details: { vin: [{ txid: 'x' }] } },
    { txid: 'b', blockHeight: undefined, details: { vin: [{ txid: 'x' }] } },
    { txid: 'd', blockHeight: 40, details: { vin: [{ txid: 'c' }] } },
    { txid: 'i', blockHeight: 10, details: { vin: [{ txid: 'j' }] } },
    { txid: 'f', blockHeight: 30, details: { vin: [{ txid: 'c' }, { txid: 'g' }, { txid: 'x' }] } },
];

export const sortedTxs = [...'abcdefghij'].map(txid => ({ txid }));

const me = '0x9ea3721b5bf3b64b4418c38b603154d2d597fae3';
const other = '0x1111111111111111111111111111111111111111';

const makeEthTx = (p: {
    txid: string;
    status?: number; // -1 pending, 0 failed, 1 mined
    nonce?: number;
    type?: Transaction['type']; // 'sent' | 'self' | 'recv' | ...
    from?: string; // vin[0].addresses[0]
}): Transaction => {
    const tx = {
        txid: p.txid,
        type: p.type ?? 'sent',
        blockTime: 0,
        blockHeight: -1,
        amount: '0',
        fee: '0',
        targets: [],
        details: {
            vin: [
                {
                    n: 0,
                    isAddress: true,
                    addresses: [(p.from ?? me).toLowerCase()],
                },
            ],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
        ethereumSpecific: {
            status: p.status ?? -1,
            nonce: p.nonce,
        } as Transaction['ethereumSpecific'],
    } satisfies Partial<Transaction>;

    return tx as unknown as Transaction;
};

export const filterShadowedPendingTxsByNonce = [
    {
        description: 'drops pending outgoing when mined with same nonce exists (same sender)',
        input: [
            makeEthTx({ txid: 'pending-394', status: -1, nonce: 394, type: 'sent', from: me }),
            makeEthTx({ txid: 'pending-393', status: -1, nonce: 393, type: 'sent', from: me }),
            makeEthTx({ txid: 'mined-394', status: 1, nonce: 394, type: 'sent', from: me }),
        ],
        lowerCasedDescriptor: me,
        expectedTxids: ['mined-394'],
    },
    {
        description: 'keeps pending when mined has different nonce (same sender)',
        input: [
            makeEthTx({ txid: 'pending-396', status: -1, nonce: 396, type: 'sent', from: me }),
            makeEthTx({ txid: 'mined-395', status: 1, nonce: 395, type: 'sent', from: me }),
            makeEthTx({ txid: 'mined-394', status: 1, nonce: 394, type: 'sent', from: me }),
        ],
        lowerCasedDescriptor: me,
        expectedTxids: ['pending-396', 'mined-395', 'mined-394'],
    },
    {
        description: 'keeps pending when mined has different nonce (different sender)',
        input: [
            makeEthTx({
                txid: 'pending-other-10',
                status: -1,
                nonce: 10,
                type: 'recv',
                from: other,
            }),
            makeEthTx({ txid: 'mined-me-10', status: 1, nonce: 10, type: 'sent', from: me }),
            makeEthTx({ txid: 'mined-me-9', status: 1, nonce: 9, type: 'sent', from: me }),
        ],
        lowerCasedDescriptor: me,
        expectedTxids: ['pending-other-10', 'mined-me-10', 'mined-me-9'],
    },
    {
        description: 'keeps pending if there is no non-pending with same nonce',
        input: [makeEthTx({ txid: 'only-pending-7', status: -1, nonce: 7, from: me })],
        lowerCasedDescriptor: me,
        expectedTxids: ['only-pending-7'],
    },
    {
        description: 'handles nonce = 0 (falsy) correctly',
        input: [
            makeEthTx({ txid: 'pending-0', status: -1, nonce: 0, from: me }),
            makeEthTx({ txid: 'mined-0', status: 1, nonce: 0, from: me }),
        ],
        lowerCasedDescriptor: me,
        expectedTxids: ['mined-0'],
    },
    {
        description: 'self behaves like sent (outgoing) for stínění',
        input: [
            makeEthTx({ txid: 'pending-self-33', status: -1, nonce: 33, type: 'self', from: me }),
            makeEthTx({ txid: 'mined-self-33', status: 1, nonce: 33, type: 'self', from: me }),
        ],
        lowerCasedDescriptor: me,
        expectedTxids: ['mined-self-33'],
    },
    {
        description: 'failed (status=0) can shadow pending',
        input: [
            makeEthTx({ txid: 'pending-8', status: -1, nonce: 8, from: me }),
            makeEthTx({ txid: 'failed-8', status: 0, nonce: 8, from: me }),
        ],
        lowerCasedDescriptor: me,
        expectedTxids: ['failed-8'],
    },
    {
        description: 'handles more pending txs at oncecorrectly',
        input: [
            makeEthTx({ txid: 'pending-8', status: -1, nonce: 8, from: me }),
            makeEthTx({ txid: 'pending-8', status: -1, nonce: 8, from: me }),
            makeEthTx({ txid: 'pending-9', status: -1, nonce: 9, from: me }),
            makeEthTx({ txid: 'mined-8', status: 1, nonce: 8, from: me }),
        ],
        lowerCasedDescriptor: me,
        expectedTxids: ['mined-8', 'pending-9'],
    },
];
