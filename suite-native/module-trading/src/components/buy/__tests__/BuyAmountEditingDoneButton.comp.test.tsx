import { Keyboard } from 'react-native';

import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { BuyAmountEditingDoneButton } from '../BuyAmountEditingDoneButton';

describe('AmountEditingDoneButton', () => {
    it('should remove focus from active input', () => {
        const keyboardDismissSpy = jest.spyOn(Keyboard, 'dismiss');

        const { getByText } = renderWithBasicProvider(<BuyAmountEditingDoneButton />);

        fireEvent.press(getByText('Done'));

        expect(keyboardDismissSpy).toHaveBeenCalledTimes(1);
    });
});
