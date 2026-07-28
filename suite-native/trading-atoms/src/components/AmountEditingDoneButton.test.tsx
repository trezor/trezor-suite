import { Keyboard } from 'react-native';

import { getTranslation } from '@suite-native/intl';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { AmountEditingDoneButton } from './AmountEditingDoneButton';

describe('AmountEditingDoneButton', () => {
    it('should remove focus from active input', () => {
        const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');
        const { getByText } = renderWithBasicProvider(<AmountEditingDoneButton />);

        fireEvent.press(getByText(getTranslation('generic.buttons.done')));

        expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
    });
});
