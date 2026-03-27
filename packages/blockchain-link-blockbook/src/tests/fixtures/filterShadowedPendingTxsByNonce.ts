import type { EvmTransaction } from '../../types';

const me = '0x9ea3721b5bf3b64b4418c38b603154d2d597fae3';
const other = '0x1111111111111111111111111111111111111111';

const makeEthTx = (p: {
    txid: string;
    status?: number; // -1 pending, 0 failed, 1 mined
    nonce?: number;
    type?: EvmTransaction['type']; // 'sent' | 'self' | 'recv' | ...
    from?: string; // vin[0].addresses[0]
}): EvmTransaction => {
    const tx = {
        txid: p.txid,
        type: p.type ?? 'sent',
        blockTime: 0,
        blockHeight: -1,
        amount: '0',
        fee: '0',
        targets: [],
        tokens: [],
        internalTransfers: [],
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
        extra: {
            ethereumSpecific: {
                status: p.status ?? -1,
                nonce: p.nonce ?? 0,
                gasLimit: 21000,
                gasUsed: 21000,
                gasPrice: '1000000000',
            },
        },
    } satisfies Partial<EvmTransaction>;

    return tx as unknown as EvmTransaction;
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
        description: 'self behaves like sent (outgoing) for shadowing',
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
        description: 'handles more pending txs at once correctly',
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
