import { useExchangeIssue as useCommonExchangeIssue } from '@suite-common/trading';
import { FeatureFlag } from '@suite-native/feature-flags';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { useExchangeIssue } from './useExchangeIssue';
import { renderHookWithTradingProvider } from '../../__tests__/tradingTestUtils';
import { TRADING_DEX_SOURCE_ORIGIN } from '../../constants';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useExchangeIssue: jest.fn(),
}));

const mockUseCommonExchangeIssue = jest.mocked(useCommonExchangeIssue);

describe('useExchangeIssue', () => {
    it('passes native exchange context to the common hook', () => {
        const exchangeIssue = {
            isSimulationEnabled: true,
            isSimulationLoading: false,
            issue: null,
        };
        mockUseCommonExchangeIssue.mockReturnValue(exchangeIssue);

        const { result } = renderHookWithTradingProvider(() => useExchangeIssue(), {
            tradeType: 'exchange',
            overrides: {
                featureFlags: {
                    [FeatureFlag.IsTradingTxSimulationEnabled]: true,
                },
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

        expect(mockUseCommonExchangeIssue).toHaveBeenCalledWith({
            account: btc1NormalAccount,
            isEnabled: true,
            sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
        });
        expect(result.current).toBe(exchangeIssue);
    });
});
