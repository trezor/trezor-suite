import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { RippleDestinationTagField } from './RippleDestinationTagField';

describe('RippleDestinationTagField', () => {
    it('renders the value and reports edits', async () => {
        const onChange = jest.fn();
        await renderWithBasicProvider(<RippleDestinationTagField value="12" onChange={onChange} />);

        expect(screen.getByLabelText('Destination tag')).toHaveProp('value', '12');

        await fireEvent.changeText(screen.getByLabelText('Destination tag'), '123');

        expect(onChange).toHaveBeenCalledWith('123');
    });

    it('shows the message for the error the form passes', async () => {
        await renderWithBasicProvider(
            <RippleDestinationTagField value="x" onChange={jest.fn()} error="not-a-number" />,
        );

        expect(screen.getByText('Destination tag must be a whole number.')).toBeTruthy();
    });
});
