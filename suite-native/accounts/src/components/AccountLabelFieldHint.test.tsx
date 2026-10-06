import { getTranslation } from '@suite-native/intl';
import { renderHook, renderWithBasicProvider } from '@suite-native/test-utils';

import { AccountLabelFieldHint, type AccountLabelFieldHintProps } from './AccountLabelFieldHint';
import { useAccountLabelForm } from '../hooks/useAccountLabelForm';

describe('AccountLabelFieldHint', () => {
    const renderComponent = async (props: AccountLabelFieldHintProps) =>
        await renderWithBasicProvider(<AccountLabelFieldHint {...props} />);

    it('should render', async () => {
        const { result } = await renderHook(() => useAccountLabelForm('Account label'));

        const { getByText } = await renderComponent({ formControl: result.current.control });

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
