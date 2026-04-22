import { Keyboard } from 'react-native';

import { fireEvent, renderWithProviders } from '@suite-native/test-utils';

import { AmountEditingDoneButton } from '../AmountEditingDoneButton';

describe('AmountEditingDoneButton', () => {
    it('should remove focus from active input', () => {
        const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');
        const { getByText } = renderWithProviders(<AmountEditingDoneButton />, {
            providers: ['intl'],
        });

        fireEvent.press(getByText('Done'));

        expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
    });
});
