import { exchangeThunks, selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { invityDexQuote } from '@suite-native/trading-fixtures';

import { useApprovalFlow } from './useApprovalFlow';
import { createTradingLightStore } from '../../../test-utils/tradingTestUtils';

const mockConfirmApprovalThunk: any = () => () => ({
    unwrap: () => Promise.resolve({}),
});
jest.spyOn(exchangeThunks, 'confirmApprovalThunk').mockImplementation(mockConfirmApprovalThunk);

describe('useApprovalFlow', () => {
    it('should return selected quote from exchange state', async () => {
        const store = createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: invityDexQuote,
                        },
                    },
                },
            },
        });

        const { result } = await renderHookWithStoreProvider(() => useApprovalFlow(), { store });

        expect(result.current.quote).toEqual(invityDexQuote);
    });

    it('should update selected quote approval type', async () => {
        const quote = { ...invityDexQuote, approvalType: 'MINIMAL' as const };
        const store = createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: {
                        exchange: {
                            selectedQuote: quote,
                        },
                    },
                },
            },
        });
        const { result } = await renderHookWithStoreProvider(() => useApprovalFlow(), { store });

        await act(async () => {
            await result.current.onApprovalTypeChange('INFINITE');
        });

        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual({
            ...quote,
            approvalType: 'INFINITE',
        });
    });
});
