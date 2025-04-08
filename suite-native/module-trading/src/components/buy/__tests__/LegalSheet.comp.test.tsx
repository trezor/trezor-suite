import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { LegalSheet, LegalSheetProps } from '../LegalSheet';

describe('LegalSheet', () => {
    const renderLegalSheet = (props?: Partial<LegalSheetProps>) =>
        renderWithBasicProvider(
            <LegalSheet
                isVisible
                onClose={() => {}}
                onConsent={() => {}}
                tradeProviderName="TEST_PROVIDER"
                {...props}
            />,
        );

    it('should render text info with given tradeProviderName', () => {
        const { getByText } = renderLegalSheet();

        expect(getByText('Buy with TEST_PROVIDER')).toBeDefined();
        expect(
            getByText(
                "I understand that Invity doesn't provide this service. It's governed by TEST_PROVIDER’s Terms and Conditions.",
            ),
        ).toBeDefined();
    });

    it('should call onConsent callback on Continue button press and onClose not to be called', () => {
        const onConsent = jest.fn();
        const onClose = jest.fn();
        const { getByText } = renderLegalSheet({ onConsent, onClose });

        act(() => {
            fireEvent.press(getByText('Continue'));
        });

        expect(onConsent).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });
});
