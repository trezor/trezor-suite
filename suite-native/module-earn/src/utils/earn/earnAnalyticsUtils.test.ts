import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormState, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { mock } from '@trezor/dependency-injection';

import { reportTransactionCreated } from './earnAnalyticsUtils';

const precomposedTransaction: PrecomposedTransactionFinal = {
    type: 'final',
    fee: '420000',
    feePerByte: '20',
    feeLimit: '21000',
    totalSpent: '420000',
    bytes: 0,
    inputs: [],
    outputs: [{ address: 'private-recipient', amount: '123456' }],
    outputsPermutation: [0],
};

const formState: Pick<FormState, 'options' | 'selectedFee'> = {
    options: ['broadcast', 'transactionData', 'ethereumNonce'],
    selectedFee: 'custom',
};

describe('reportTransactionCreated', () => {
    it.each(['stake', 'yield'] as const)(
        'reports enabled transaction options for %s without exposing transaction contents',
        txType => {
            const services: NativeAnalyticsDep = {
                analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
            };

            reportTransactionCreated({
                analytics: services.analytics,
                symbol: asNetworkSymbol('eth'),
                precomposedTransaction,
                formState,
                txType,
            });

            expect(services.analytics.report).toHaveBeenCalledWith({
                type: 'transaction-created',
                payload: {
                    action: 'sent',
                    symbol: 'eth',
                    tokens: '',
                    outputsCount: 1,
                    broadcast: true,
                    bitcoinLocktime: false,
                    transactionData: true,
                    ethereumNonce: true,
                    destinationTag: false,
                    selectedFee: 'custom',
                    isCoinControlEnabled: false,
                    hasCoinControlBeenOpened: false,
                    txType,
                },
            });
        },
    );

    it('reports disabled options and the default fee level', () => {
        const services: NativeAnalyticsDep = {
            analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
        };

        reportTransactionCreated({
            analytics: services.analytics,
            symbol: asNetworkSymbol('sol'),
            precomposedTransaction,
            formState: { options: [] },
            txType: 'stake',
        });

        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'transaction-created',
            payload: expect.objectContaining({
                transactionData: false,
                ethereumNonce: false,
                bitcoinLocktime: false,
                destinationTag: false,
                selectedFee: 'normal',
            }),
        });
    });
});
