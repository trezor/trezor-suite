import { act, fireEvent, render } from '@suite-native/test-utils';

import { LegalSheet, LegalSheetProps } from '../LegalSheet';

describe('LegalSheet', () => {
    const renderLegalSheet = (props?: Partial<LegalSheetProps>) =>
        render(
            <LegalSheet
                isVisible
                onClose={() => {}}
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

    it('should call onClose callback on Continue button press', () => {
        const onClose = jest.fn();
        const { getByText } = renderLegalSheet({ onClose });

        act(() => {
            fireEvent.press(getByText('Continue'));
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
