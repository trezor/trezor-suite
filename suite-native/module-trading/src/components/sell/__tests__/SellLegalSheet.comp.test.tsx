import { act, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { SellLegalSheet, SellLegalSheetProps } from '../SellLegalSheet';

describe('SellLegalSheet', () => {
    const renderLegalSheet = (props?: Partial<SellLegalSheetProps>) =>
        renderWithStoreProviderAsync(
            <SellLegalSheet
                isVisible
                onDismiss={() => {}}
                onConsent={() => {}}
                tradeProvider="invity"
                sendSymbol="usdc"
                {...props}
            />,
            { preloadedState: { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } } },
        );

    it('should render text info with given tradeProviderName', async () => {
        const { getByText } = await renderLegalSheet();

        expect(getByText(/contact Trezor Support/)).toBeTruthy();
        expect(getByText(/It's governed by Invity Finance’s Terms & Conditions./)).toBeTruthy();
    });

    it('should call onConsent callback on Continue button press and onDismiss not to be called', async () => {
        const onConsent = jest.fn();
        const onDismiss = jest.fn();
        const { getByText } = await renderLegalSheet({ onConsent, onDismiss });

        act(() => {
            fireEvent.press(getByText('Continue'));
        });

        expect(onConsent).toHaveBeenCalledTimes(1);
        expect(onDismiss).not.toHaveBeenCalled();
    });
});
