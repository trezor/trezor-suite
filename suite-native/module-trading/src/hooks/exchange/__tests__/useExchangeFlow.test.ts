import {
    PreloadedState,
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { useExchangeFlow } from '../useExchangeFlow';

// Mock the exchange thunks
jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        confirmTradeThunk: (payload: unknown) => ({
            type: 'confirmTradeThunkMock',
            payload,
            unwrap: () => Promise.resolve(true),
        }),
    },
}));

describe('useExchangeFlow', () => {
    const getInitializedStore = async () => {
        const preloadedState: PreloadedState = {
            wallet: {
                tradingNew: getInitializedTradingStateWithQuotes(),
            },
        };

        return await initStore(preloadedState);
    };

    const renderUseExchangeFlow = ({ store }: { store: TestStore }) =>
        renderHookWithStoreProviderAsync(() => useExchangeFlow(), { store });

    it('should return confirmTrade function', async () => {
        const store = await getInitializedStore();

        const { result } = await renderUseExchangeFlow({ store });

        expect(result.current.confirmTrade).toBeDefined();
        expect(typeof result.current.confirmTrade).toBe('function');
    });

    it('should call confirmTradeThunk when confirmTrade is called', async () => {
        const store = await getInitializedStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        const { result } = await renderUseExchangeFlow({ store });

        const mockTrade = {
            orderId: 'test-order',
            exchange: 'test-exchange',
        };

        const mockAccount = {
            key: 'test-account',
            symbol: 'btc',
        };

        await act(async () => {
            await result.current.confirmTrade({
                receiveAddress: 'test-address',
                trade: mockTrade,
                approvalFlow: false,
                sendAccount: mockAccount,
            });
        });

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'confirmTradeThunkMock',
            }),
        );
    });
});
