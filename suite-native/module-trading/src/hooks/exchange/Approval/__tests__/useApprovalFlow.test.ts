import {
    exchangeThunks,
    selectTradingExchangeSelectedQuote,
    tradingSettingsActions,
} from '@suite-common/trading';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getEthAccount, invityDexQuote } from '@suite-native/trading-fixtures';

import { createTradingLightStore } from '../../../../__tests__/tradingTestUtils';
import { useApprovalFlow } from '../useApprovalFlow';

const mockConfirmApprovalThunk: any = () => () => ({
    unwrap: () => Promise.resolve({}),
});
jest.spyOn(exchangeThunks, 'confirmApprovalThunk').mockImplementation(mockConfirmApprovalThunk);

describe('useApprovalFlow', () => {
    const ethAccount = getEthAccount({ descriptor: asAccountDescriptor('ethAccount') });

    it('should return selected quote from exchange state', () => {
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

        const { result } = renderHookWithStoreProvider(() => useApprovalFlow(), { store });

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
        const { result } = renderHookWithStoreProvider(() => useApprovalFlow(), { store });

        await act(async () => {
            await result.current.onApprovalTypeChange('INFINITE');
        });

        expect(selectTradingExchangeSelectedQuote(store.getState())).toEqual({
            ...quote,
            approvalType: 'INFINITE',
        });
    });

    it('should confirm approval with maxSlippage value', async () => {
        const store = createTradingLightStore({
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    accounts: [ethAccount],
                    trading: {
                        exchange: {
                            selectedQuote: invityDexQuote,
                            tradingAccountKey: ethAccount.key,
                            receiveAccountKey: ethAccount.key,
                        },
                    },
                },
            },
        });

        store.dispatch(tradingSettingsActions.setMaxSlippagePercentage('2.5'));

        const { result } = renderHookWithStoreProvider(() => useApprovalFlow(), { store });

        await act(async () => {
            await result.current.confirmApproval(invityDexQuote);
        });

        expect(exchangeThunks.confirmApprovalThunk).toHaveBeenCalledWith(
            expect.objectContaining({
                trade: expect.objectContaining({
                    quoteId: invityDexQuote.quoteId,
                    swapSlippage: '2.5',
                }),
            }),
        );
    });
});
