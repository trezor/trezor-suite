import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { useDexExchangeTxSimulation as useCommonDexExchangeTxSimulation } from '@suite-common/trading';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';
import { TRADING_DEX_SOURCE_ORIGIN } from '../../constants';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useDexExchangeTxSimulation: jest.fn(),
}));

const mockUseCommonDexExchangeTxSimulation = jest.mocked(useCommonDexExchangeTxSimulation);

describe('useDexExchangeTxSimulation', () => {
    const simulation = {
        isEnabled: true,
        isLoading: false,
        error: null,
        data: undefined,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseCommonDexExchangeTxSimulation.mockReturnValue(simulation);
    });

    const renderUseDexExchangeTxSimulation = async (isRemoteFeatureEnabled?: boolean) =>
        await renderHookWithTradingProvider(() => useDexExchangeTxSimulation(), {
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
        const { result } = await renderUseDexExchangeTxSimulation();

        expect(mockUseCommonDexExchangeTxSimulation).toHaveBeenCalledWith({
            account: btc1NormalAccount,
            isEnabled: true,
            sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
        });
        expect(result.current).toBe(simulation);
    });

    it('passes a disabled state when the message-system feature is disabled', async () => {
        await renderUseDexExchangeTxSimulation(false);

        expect(mockUseCommonDexExchangeTxSimulation).toHaveBeenCalledWith({
            account: btc1NormalAccount,
            isEnabled: false,
            sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
        });
    });
});
