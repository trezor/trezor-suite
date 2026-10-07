import { asNetworkSymbol } from '@trezor/network-module-types';

import type { ChainSendAccount } from './ChainSend';
import type { PrecomposedTransactionFinal } from './PrecomposedTransaction';
import { buildPendingTransaction } from './buildPendingTransaction';

const account = {
    symbol: asNetworkSymbol('eth'),
    descriptor: '0xsender',
} as ChainSendAccount;

const precomposed = (overrides: Partial<PrecomposedTransactionFinal> = {}) =>
    ({
        type: 'final',
        fee: '21',
        totalSpent: '1021',
        outputs: [{ address: '0xrecipient', amount: '1000' }],
        ...overrides,
    }) as PrecomposedTransactionFinal;

const signed = { serializedTx: '0xsigned' };

describe('buildPendingTransaction', () => {
    it('shows a sent coin transfer, not yet in a block', () => {
        const transaction = buildPendingTransaction({
            account,
            precomposed: precomposed(),
            signed,
            txid: '0xtx',
        });

        expect(transaction).toMatchObject({
            type: 'sent',
            txid: '0xtx',
            amount: '1000',
            fee: '21',
            targets: [{ n: 0, addresses: ['0xrecipient'], isAddress: true, amount: '1000' }],
            tokens: [],
        });
        expect(transaction.blockHeight).toBeUndefined();
    });

    it('shows a token transfer as a token sent, moving no coins', () => {
        const transaction = buildPendingTransaction({
            account,
            precomposed: precomposed({
                token: {
                    contract: '0xtoken',
                    standard: 'ERC20',
                    symbol: 'usdc',
                    name: 'USD Coin',
                    decimals: 6,
                },
            }),
            signed,
            txid: '0xtx',
        });

        expect(transaction).toMatchObject({
            amount: '0',
            targets: [{ amount: '0' }],
            tokens: [
                {
                    type: 'sent',
                    amount: '1000',
                    from: '0xsender',
                    to: '0xrecipient',
                    contract: '0xtoken',
                    decimals: 6,
                },
            ],
        });
    });

    it('lists only outputs to an address', () => {
        const transaction = buildPendingTransaction({
            account,
            precomposed: precomposed({
                outputs: [
                    { address: 'bc1recipient', amount: '1000' },
                    { address_n: [1], amount: '5' },
                ] as unknown as PrecomposedTransactionFinal['outputs'],
            }),
            signed,
            txid: 'tx',
        });

        expect(transaction.targets).toHaveLength(1);
    });
});
