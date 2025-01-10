import { render, renderHook } from '@suite-native/test-utils';

import { AccountLabelFieldHint, AccountLabelFieldHintProps } from '../AccountLabelFieldHint';
import { useAccountLabelForm } from '../../hooks/useAccountLabelForm';

describe('AccountLabelFieldHint', () => {
    const renderComponent = (props: AccountLabelFieldHintProps) =>
        render(<AccountLabelFieldHint {...props} />);

    test('should render', () => {
        const { result } = renderHook(() => useAccountLabelForm('Account label'));

        const { getByText } = renderComponent({ formControl: result.current.control });

        expect(getByText('13 / 30 letters')).toBeDefined();
    });
});
