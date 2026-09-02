import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { useExchangeIssue as useCommonExchangeIssue } from '@suite-common/trading';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { useExchangeIssue } from './useExchangeIssue';
import { TRADING_DEX_SOURCE_ORIGIN } from '../../constants';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useExchangeIssue: jest.fn(),
}));

const mockUseCommonExchangeIssue = jest.mocked(useCommonExchangeIssue);

describe('useExchangeIssue', () => {
    const exchangeIssue = {
        isSimulationEnabled: true,
        isSimulationLoading: false,
        isSimulation: false,
        issue: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseCommonExchangeIssue.mockReturnValue(exchangeIssue);
    });

    const renderUseExchangeIssue = async (isRemoteFeatureEnabled?: boolean) =>
        await renderHookWithTradingProvider(() => useExchangeIssue(), {
            tradeType: 'exchange',
            overrides: {
                ...(isRemoteFeatureEnabled === undefined
                    ? {}
                    : {
                          messageSystem: mockMessageSystemStateWithFeatureFlags({
                              'trading.txSimulation': isRemoteFeatureEnabled,
                          }),
                      }),
                wallet: {
                    accounts: [btc1NormalAccount],
                    trading: {
                        exchange: {
                            tradingAccountKey: btc1NormalAccount.key,
                        },
                    },
                },
            },
        });

    it('passes the enabled native exchange context to the common hook', async () => {
        const { result } = await renderUseExchangeIssue();

        expect(mockUseCommonExchangeIssue).toHaveBeenCalledWith({
            account: btc1NormalAccount,
            isEnabled: true,
            sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
        });
        expect(result.current).toBe(exchangeIssue);
    });

    it('passes a disabled state when the message-system feature is disabled', async () => {
        await renderUseExchangeIssue(false);

        expect(mockUseCommonExchangeIssue).toHaveBeenCalledWith({
            account: btc1NormalAccount,
            isEnabled: false,
            sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
        });
    });
});
