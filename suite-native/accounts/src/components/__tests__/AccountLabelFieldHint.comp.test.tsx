import { render, renderHook } from '@suite-native/test-utils';

import { useAccountLabelForm } from '../../hooks/useAccountLabelForm';
import { AccountLabelFieldHint, AccountLabelFieldHintProps } from '../AccountLabelFieldHint';

describe('AccountLabelFieldHint', () => {
    const renderComponent = (props: AccountLabelFieldHintProps) =>
        render(<AccountLabelFieldHint {...props} />);

    test('should render', () => {
        const { result } = renderHook(() => useAccountLabelForm('Account label'));

        const { getByText } = renderComponent({ formControl: result.current.control });

        expect(getByText('13 / 30 letters')).toBeDefined();
    });
});
