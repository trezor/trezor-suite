import { act } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, usdcAsset } from '@suite-native/trading-fixtures';

import { renderHookWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { useExchangeBuyTradeableAssetsFilteredData } from '../useExchangeBuyTradeableAssetsFilteredData';

const mockUseWatch = jest.fn();

jest.mock('@suite-native/forms', () => ({
    ...jest.requireActual('@suite-native/forms'),
    useWatch: (...args: unknown[]) => mockUseWatch(...args),
}));

jest.mock('../useExchangeFormContext', () => ({
    ...jest.requireActual('../useExchangeFormContext'),
    useExchangeFormContext: () => ({
        control: undefined,
    }),
}));

describe('useExchangeBuyTradeableAssetsFilteredData', () => {
    const renderUseExchangeBuyTradeableAssetsFilteredData = () =>
        renderHookWithTradingProvider(() => useExchangeBuyTradeableAssetsFilteredData(), {
            tradeType: 'exchange',
        });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all available exchange buy assets when sendAsset is not selected', () => {
        mockUseWatch.mockReturnValue(undefined);

        const { result } = renderUseExchangeBuyTradeableAssetsFilteredData();

        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ cryptoId: usdcAsset.cryptoId }),
            expect.objectContaining({ cryptoId: ethAsset.cryptoId }),
            expect.objectContaining({ cryptoId: btcAsset.cryptoId }),
        ]);
    });

    it('should filter assets by search text', () => {
        mockUseWatch.mockReturnValue(undefined);

        const { result } = renderUseExchangeBuyTradeableAssetsFilteredData();

        act(() => {
            result.current.setFilterValue('usdc');
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.cryptoId).toBe(usdcAsset.cryptoId);
    });
});
