import { getTranslation } from '@suite-native/intl';
import { renderHook, renderWithBasicProvider } from '@suite-native/test-utils';

import { useAccountLabelForm } from '../../hooks/useAccountLabelForm';
import { AccountLabelFieldHint, type AccountLabelFieldHintProps } from '../AccountLabelFieldHint';

describe('AccountLabelFieldHint', () => {
    const renderComponent = (props: AccountLabelFieldHintProps) =>
        renderWithBasicProvider(<AccountLabelFieldHint {...props} />);

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
