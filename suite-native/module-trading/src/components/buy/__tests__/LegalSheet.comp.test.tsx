import { act, fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingStateWithQuotes } from '../../../__fixtures__/tradingState';
import { LegalSheet, LegalSheetProps } from '../LegalSheet';

jest.mock('@suite-common/wallet-core', () => {
    const fiatRate = { rate: 1e8 };

    return {
        ...jest.requireActual('@suite-common/wallet-core'),
        selectFiatRatesByFiatRateKey: () => fiatRate,
    };
});

describe('LegalSheet', () => {
    const renderLegalSheet = (props?: Partial<LegalSheetProps>) =>
        renderWithStoreProviderAsync(
            <LegalSheet
                isVisible
                onClose={() => {}}
                onConsent={() => {}}
                tradeProvider="invity"
                {...props}
            />,
            { preloadedState: { wallet: { tradingNew: getInitializedTradingStateWithQuotes() } } },
        );

    it('should render text info with given tradeProviderName', async () => {
        const { getByText } = await renderLegalSheet();

        expect(getByText('Buy with Invity Finance')).toBeTruthy();
        expect(
            getByText(
                "I understand that Invity doesn't provide this service. It's governed by Invity Finance’s Terms and Conditions.",
            ),
        ).toBeTruthy();
    });

    it('should call onConsent callback on Continue button press and onClose not to be called', async () => {
        const onConsent = jest.fn();
        const onClose = jest.fn();
        const { getByText } = await renderLegalSheet({ onConsent, onClose });

        act(() => {
            fireEvent.press(getByText('Continue'));
        });

        expect(onConsent).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });
});
