import { getTranslation } from '@suite-native/intl';
import { renderHook, renderWithProviders } from '@suite-native/test-utils';

import { useAccountLabelForm } from '../../hooks/useAccountLabelForm';
import { AccountLabelFieldHint, type AccountLabelFieldHintProps } from '../AccountLabelFieldHint';

describe('AccountLabelFieldHint', () => {
    const renderComponent = (props: AccountLabelFieldHintProps) =>
        renderWithProviders(<AccountLabelFieldHint {...props} />, { providers: ['intl'] });

    it('should render', () => {
        const { result } = renderHook(() => useAccountLabelForm('Account label'));

        const { getByText } = renderComponent({ formControl: result.current.control });

        expect(
            getByText(
                getTranslation('accounts.accountLabelFieldHint.letterCount', {
                    current: 13,
                    max: 30,
                }),
            ),
        ).toBeTruthy();
    });
});
