import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNavigateToTransactionDetail } from './useNavigateToTransactionDetail';
import { RootStackRoutes, TransactionDetailStackRoutes } from '../routes';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('useNavigateToTransactionDetail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('navigates to the transaction detail with the supplied params', async () => {
        const accountKey = mockAccountKey({
            symbol: asNetworkSymbol('btc'),
            descriptor: 'descriptor',
        });
        const { result } = await renderHookWithBasicProvider(() =>
            useNavigateToTransactionDetail(),
        );

        act(() => result.current({ txid: 'txid', accountKey }));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.TransactionDetailStack, {
            screen: TransactionDetailStackRoutes.TransactionDetail,
            params: { txid: 'txid', accountKey },
        });
    });
});
