import { asNetworkSymbol } from '@suite-common/wallet-config';
import { explorerInitialState } from '@suite-common/wallet-core';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { mockTransaction } from '@suite-native/tokens';

import { useYieldPendingTransactionDetails } from './useYieldPendingTransactionDetails';

const mockOpenLink = jest.fn();
jest.mock('@suite-native/link', () => ({ useOpenLink: () => mockOpenLink }));

const networkSymbol = asNetworkSymbol('eth');
const accountKey = mockAccountKey({ symbol: networkSymbol, descriptor: 'testDescriptor' });
const transaction = { ...mockTransaction, symbol: networkSymbol, blockHeight: 0 };
const vaultId = 'test-vault-id';

type Props = Parameters<typeof useYieldPendingTransactionDetails>[0];

const renderDetails = async (props: Partial<Props> = {}) => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const view = await renderHookWithStoreProvider(useYieldPendingTransactionDetails, {
        initialProps: {
            accountKey,
            txid: transaction.txid,
            transactionType: 'deposit',
            vaultId,
            ...props,
        },
        services,
        preloadedState: {
            wallet: {
                transactions: {
                    transactions: { [accountKey]: [transaction] },
                    fetchStatusDetail: {},
                    phishing: {},
                },
                explorer: explorerInitialState,
            },
        },
    });

    return { ...view, analytics: services.analytics };
};

describe('useYieldPendingTransactionDetails', () => {
    beforeEach(() => jest.clearAllMocks());

    it('reports only an explicit explorer open, without account or transaction identifiers', async () => {
        const { result, analytics } = await renderDetails();

        expect(analytics.report).not.toHaveBeenCalled();
        await act(() => result.current.openInBlockchain());

        expect(mockOpenLink).toHaveBeenCalledTimes(1);
        expect(mockOpenLink).toHaveBeenCalledWith(result.current.explorerUrl);
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: { element: 'pending-tx-open', value: 'deposit', networkSymbol, vaultId },
        });
    });

    it.each(['approve', 'revoke', 'withdraw', 'redeem', 'claim', 'wrap', 'unwrap'] as const)(
        'preserves the pending transaction type %s without inventing a vault context',
        async transactionType => {
            const { result, analytics } = await renderDetails({
                transactionType,
                vaultId: undefined,
            });

            await act(() => result.current.openInBlockchain());

            expect(analytics.report).toHaveBeenCalledWith({
                type: 'yield/interaction',
                payload: {
                    element: 'pending-tx-open',
                    value: transactionType,
                    networkSymbol,
                    vaultId: undefined,
                },
            });
        },
    );

    it('does not report an unavailable explorer', async () => {
        const { result, analytics } = await renderDetails({ txid: null });

        await act(() => result.current.openInBlockchain());

        expect(analytics.report).not.toHaveBeenCalled();
        expect(mockOpenLink).not.toHaveBeenCalled();
    });
});
