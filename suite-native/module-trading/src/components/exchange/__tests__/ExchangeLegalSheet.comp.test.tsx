import { act, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { ExchangeLegalSheet, ExchangeLegalSheetProps } from '../ExchangeLegalSheet';

jest.mock('@suite-common/wallet-core', () => {
    const fiatRate = { rate: 1e8 };

    return {
        ...jest.requireActual('@suite-common/wallet-core'),
        selectFiatRatesByFiatRateKey: () => fiatRate,
    };
});

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useTradingInfo: () => ({
        cryptoIdToSymbolAndContractAddress: (cryptoId: string) => ({
            coinSymbol: cryptoId === 'btc' ? 'btc' : 'eth',
            contractAddress: undefined,
        }),
    }),
}));

describe('ExchangeLegalSheet', () => {
    const renderLegalSheet = (props?: Partial<ExchangeLegalSheetProps>) =>
        renderWithStoreProviderAsync(
            <ExchangeLegalSheet
                isVisible
                onDismiss={() => {}}
                onConsent={() => {}}
                provider="invity"
                send="btc"
                receive="eth"
                isDex={false}
                {...props}
            />,
            { preloadedState: { wallet: { trading: getInitializedTradingStateWithQuotes() } } },
        );

    it('should render text info with given provider name for CEX', async () => {
        const { getByText } = await renderLegalSheet();

        // Check that the provider name is included in the content
        expect(getByText(/Invity Finance/)).toBeTruthy();
    });

    it('should render text info with given provider name for DEX', async () => {
        const { getAllByText } = await renderLegalSheet({ isDex: true });

        // Check that the provider name is included in the content
        expect(getAllByText(/Invity Finance/).length).toBeGreaterThan(0);
    });

    it('should call onConsent callback on Continue button press and onDismiss not to be called', async () => {
        const onConsent = jest.fn();
        const onDismiss = jest.fn();
        const { getByText } = await renderLegalSheet({ onConsent, onDismiss });

        act(() => {
            fireEvent.press(getByText("I'm ready to swap"));
        });

        expect(onConsent).toHaveBeenCalledTimes(1);
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should render different content for DEX vs CEX', async () => {
        const { getByText: getCexText } = await renderLegalSheet({ isDex: false });
        const { getByText: getDexText } = await renderLegalSheet({ isDex: true });

        expect(getCexText(/Trezor Support/)).toBeTruthy();
        expect(getDexText(/DEX/)).toBeTruthy();
    });

    it('should handle different providers', async () => {
        const { getByText } = await renderLegalSheet({ provider: 'cexdirect' });

        // Check that the different provider name is included
        expect(getByText(/Cexdirect/)).toBeTruthy();
    });
});
