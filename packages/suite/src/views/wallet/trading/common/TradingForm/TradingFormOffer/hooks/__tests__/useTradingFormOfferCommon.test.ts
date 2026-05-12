import { renderHook } from '@testing-library/react';

import { useTradingFormOfferCommon } from '../useTradingFormOfferCommon';

const mockGetSelectedQuote = jest.fn();
const mockGetCryptoQuoteAmountProps = jest.fn();
const mockGetSelectedCryptoId = jest.fn();

jest.mock('src/utils/wallet/trading/tradingTypingUtils', () => ({
    getSelectedQuote: (...args: unknown[]) => mockGetSelectedQuote(...args),
    getCryptoQuoteAmountProps: (...args: unknown[]) => mockGetCryptoQuoteAmountProps(...args),
    getSelectedCryptoId: (...args: unknown[]) => mockGetSelectedCryptoId(...args),
}));

const mockUseTradingFormContext = jest.fn();

jest.mock('src/hooks/wallet/trading/form/useTradingCommonForm', () => ({
    useTradingFormContext: () => mockUseTradingFormContext(),
}));

const mockUseSelector = jest.fn();

jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: unknown) => mockUseSelector(selector),
}));

const mockUseTradingDeviceDisconnected = jest.fn();

jest.mock('src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected', () => ({
    useTradingDeviceDisconnected: () => mockUseTradingDeviceDisconnected(),
}));

const setupSelectors = ({
    isTorEnabled = false,
    areFeesLoading = false,
    isDiscoveryRunning = false,
} = {}) => {
    mockUseSelector.mockReset();
    mockUseSelector
        .mockReturnValueOnce({ isTorEnabled })
        .mockReturnValueOnce(areFeesLoading)
        .mockReturnValueOnce(isDiscoveryRunning);
};

const buildContext = (overrides: Record<string, unknown> = {}) => ({
    account: { symbol: 'btc' },
    isAmountEmpty: false,
    watch: () => ({ amountInCrypto: false }),
    form: { state: { isLoadingOrInvalid: false, isFormLoading: false } },
    type: 'buy' as const,
    ...overrides,
});

const buildFormState = (overrides: Record<string, unknown> = {}) => ({
    isLoadingOrInvalid: false,
    isFormLoading: false,
    ...overrides,
});

describe('useTradingFormOfferCommon', () => {
    beforeEach(() => {
        mockGetSelectedQuote.mockReturnValue({ exchange: 'provider1' });
        mockGetCryptoQuoteAmountProps.mockReturnValue({
            sendAmount: '100',
            receiveCurrency: 'btc',
        });
        mockGetSelectedCryptoId.mockReturnValue('btc');
        setupSelectors();
        mockUseTradingDeviceDisconnected.mockReturnValue({ tradingDeviceDisconnected: false });
        mockUseTradingFormContext.mockReturnValue(buildContext());
    });

    describe('sendAmount', () => {
        it('returns sendAmount from quoteAmounts when form state is valid', () => {
            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.sendAmount).toBe('100');
        });

        it('returns "0" when state is loading or invalid', () => {
            mockUseTradingFormContext.mockReturnValue(
                buildContext({ form: { state: buildFormState({ isLoadingOrInvalid: true }) } }),
            );

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.sendAmount).toBe('0');
        });
    });

    describe('selectedAssetCryptoId', () => {
        it('returns receiveCurrency from quoteAmounts when form state is valid', () => {
            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.selectedAssetCryptoId).toBe('btc');
        });

        it('falls back to selectedCryptoId when state is loading or invalid', () => {
            mockUseTradingFormContext.mockReturnValue(
                buildContext({ form: { state: buildFormState({ isLoadingOrInvalid: true }) } }),
            );
            mockGetSelectedCryptoId.mockReturnValue('eth');

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.selectedAssetCryptoId).toBe('eth');
        });
    });

    describe('noOffersWithTor', () => {
        it('is true when Tor is enabled, there is no quote, and form is not loading', () => {
            mockGetSelectedQuote.mockReturnValue(undefined);
            setupSelectors({ isTorEnabled: true });

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.noOffersWithTor).toBe(true);
        });

        it('is false when Tor is disabled', () => {
            mockGetSelectedQuote.mockReturnValue(undefined);

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.noOffersWithTor).toBe(false);
        });

        it('is false when Tor is enabled but a quote exists', () => {
            setupSelectors({ isTorEnabled: true });

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.noOffersWithTor).toBe(false);
        });
    });

    describe('isConfirmButtonLoading', () => {
        it('is true when fees are loading', () => {
            setupSelectors({ areFeesLoading: true });

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.isConfirmButtonLoading).toBe(true);
        });

        it('is true when form is loading and amount is not empty', () => {
            mockUseTradingFormContext.mockReturnValue(
                buildContext({
                    isAmountEmpty: false,
                    form: { state: buildFormState({ isFormLoading: true }) },
                }),
            );

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.isConfirmButtonLoading).toBe(true);
        });

        it('is false when form is loading but amount is empty', () => {
            mockUseTradingFormContext.mockReturnValue(
                buildContext({
                    isAmountEmpty: true,
                    form: { state: buildFormState({ isFormLoading: true }) },
                }),
            );

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.isConfirmButtonLoading).toBe(false);
        });
    });

    describe('confirmButtonTranslationId', () => {
        it('returns TR_TRADING_OFFER_LOOKING when form is loading with a non-empty amount', () => {
            mockUseTradingFormContext.mockReturnValue(
                buildContext({
                    isAmountEmpty: false,
                    form: { state: buildFormState({ isFormLoading: true }) },
                }),
            );

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.confirmButtonTranslationId).toBe('TR_TRADING_OFFER_LOOKING');
        });

        it('delegates to tradingGetSectionActionLabel when not loading', () => {
            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.confirmButtonTranslationId).toBe('TR_BUY');
        });
    });

    describe('isBaseButtonDisabled', () => {
        it('is false when all conditions allow confirming', () => {
            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.isBaseButtonDisabled).toBe(false);
        });

        it('is true when there is no quote', () => {
            mockGetSelectedQuote.mockReturnValue(undefined);

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.isBaseButtonDisabled).toBe(true);
        });

        it('is true when device is disconnected', () => {
            mockUseTradingDeviceDisconnected.mockReturnValue({ tradingDeviceDisconnected: true });

            const { result } = renderHook(() => useTradingFormOfferCommon());

            expect(result.current.isBaseButtonDisabled).toBe(true);
        });
    });
});
