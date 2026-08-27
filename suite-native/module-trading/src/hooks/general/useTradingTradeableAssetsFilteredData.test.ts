import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { mockNetworkModuleRepository } from '@suite-common/networks/mocks';
import { act } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { selectExchangeBuyTradeableAssets } from '@suite-native/trading-state';

import { useTradingTradeableAssetsFilteredData } from './useTradingTradeableAssetsFilteredData';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

const mockUseWatch = jest.fn();
const services: NetworkModuleRepositoryDep = {
    networkModuleRepository: {
        ...mockNetworkModuleRepository(),
        getSupportedNetworks: () => ['btc', 'eth'],
    },
};

jest.mock('@suite-native/forms', () => ({
    ...jest.requireActual('@suite-native/forms'),
    useWatch: (...args: unknown[]) => mockUseWatch(...args),
}));

jest.mock('../exchange/useExchangeFormContext', () => ({
    ...jest.requireActual('../exchange/useExchangeFormContext'),
    useExchangeFormContext: () => ({
        control: undefined,
    }),
}));

describe('useTradingTradeableAssetsFilteredData', () => {
    const renderUseTradingTradeableAssetsFilteredData = async () =>
        await renderHookWithTradingProvider(
            () => useTradingTradeableAssetsFilteredData(selectExchangeBuyTradeableAssets),
            { services, tradeType: 'exchange' },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns assets selected by the supplied selector', async () => {
        mockUseWatch.mockReturnValue(undefined);

        const { result } = await renderUseTradingTradeableAssetsFilteredData();

        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ cryptoId: btcAsset.cryptoId }),
            expect.objectContaining({ cryptoId: ethAsset.cryptoId }),
            expect.objectContaining({ cryptoId: usdcAsset.cryptoId }),
        ]);
    });

    it('filters the selected assets by search text', async () => {
        mockUseWatch.mockReturnValue(undefined);

        const { result } = await renderUseTradingTradeableAssetsFilteredData();

        await act(() => {
            result.current.setFilterValue('usdc');
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.cryptoId).toBe(usdcAsset.cryptoId);
    });
});
