import type { CreatePendingTransactionParams } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEvmPendingTransaction } from './createEvmPendingTransaction';

const params = (
    overrides: Partial<CreatePendingTransactionParams> = {},
): CreatePendingTransactionParams => ({
    account: {
        symbol: asNetworkSymbol('eth'),
        descriptor: '0xsender',
        index: 0,
        path: "m/44'/60'/0'/0/0",
        accountType: 'normal',
        deviceState: 'wallet-identity',
        balance: '1',
        availableBalance: '1',
        formattedBalance: '1',
    },
    precomposed: {
        type: 'final',
        fee: '42000000000000',
        feePerByte: '2',
        feeLimit: '21000',
        totalSpent: '100042000000000000',
        outputs: [{ address: '0xrecipient', amount: '100000000000000000' }],
    } as CreatePendingTransactionParams['precomposed'],
    signed: { serializedTx: '0xsigned', nonce: '12' },
    txid: '0xhash',
    ...overrides,
});

describe(createEvmPendingTransaction.name, () => {
    it('keeps the nonce and the gas price it was signed with', () => {
        expect(createEvmPendingTransaction(params())).toMatchObject({
            type: 'sent',
            txid: '0xhash',
            ethereumSpecific: {
                status: -1,
                nonce: 12,
                gasLimit: 21000,
                gasPrice: '2000000000',
                maxFeePerGas: undefined,
            },
        });
    });

    it('keeps the fee caps of an EIP-1559 transaction', () => {
        const { precomposed } = params();

        expect(
            createEvmPendingTransaction(
                params({
                    precomposed: {
                        ...precomposed,
                        maxFeePerGas: '3',
                        maxPriorityFeePerGas: '1',
                    } as CreatePendingTransactionParams['precomposed'],
                }),
            ).ethereumSpecific,
        ).toMatchObject({
            gasPrice: undefined,
            maxFeePerGas: '3000000000',
            maxPriorityFeePerGas: '1000000000',
        });
    });

    it('has no EVM details without a signed nonce', () => {
        expect(
            createEvmPendingTransaction(params({ signed: { serializedTx: '0xsigned' } }))
                .ethereumSpecific,
        ).toBeUndefined();
    });
});
