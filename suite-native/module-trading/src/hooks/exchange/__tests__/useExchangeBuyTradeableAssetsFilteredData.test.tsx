import { type PreloadedState, act, renderHookWithStoreProvider } from '@suite-native/test-utils';
import { btcAsset, ethAsset, getWalletState, usdcAsset } from '@suite-native/trading-fixtures';

import { useExchangeBuyTradeableAssetsFilteredData } from '../useExchangeBuyTradeableAssetsFilteredData';

const mockWatch = jest.fn();

jest.mock('../useExchangeFormContext', () => ({
    ...jest.requireActual('../useExchangeFormContext'),
    useExchangeFormContext: () => ({
        watch: mockWatch,
    }),
}));

describe('useExchangeBuyTradeableAssetsFilteredData', () => {
    const renderUseExchangeBuyTradeableAssetsFilteredData = () => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };

        return renderHookWithStoreProvider(() => useExchangeBuyTradeableAssetsFilteredData(), {
            preloadedState,
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all available exchange buy assets when sendAsset is not selected', () => {
        mockWatch.mockReturnValue(undefined);

        const { result } = renderUseExchangeBuyTradeableAssetsFilteredData();

        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ cryptoId: usdcAsset.cryptoId }),
            expect.objectContaining({ cryptoId: ethAsset.cryptoId }),
            expect.objectContaining({ cryptoId: btcAsset.cryptoId }),
        ]);
    });

    it('should exclude sendAsset from the filtered list', () => {
        mockWatch.mockReturnValue(btcAsset);

        const { result } = renderUseExchangeBuyTradeableAssetsFilteredData();

        expect(result.current.filteredData).toHaveLength(2);
        expect(result.current.filteredData).toEqual([
            expect.objectContaining({ cryptoId: usdcAsset.cryptoId }),
            expect.objectContaining({ cryptoId: ethAsset.cryptoId }),
        ]);
        expect(result.current.filteredData).not.toContainEqual(
            expect.objectContaining({ cryptoId: btcAsset.cryptoId }),
        );
    });

    it('should filter assets by search text', () => {
        mockWatch.mockReturnValue(undefined);

        const { result } = renderUseExchangeBuyTradeableAssetsFilteredData();

        act(() => {
            result.current.setFilterValue('usdc');
        });

        expect(result.current.filteredData).toHaveLength(1);
        expect(result.current.filteredData[0]?.cryptoId).toBe(usdcAsset.cryptoId);
    });
});
