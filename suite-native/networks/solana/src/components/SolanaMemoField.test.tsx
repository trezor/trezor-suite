import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { SolanaMemoField } from './SolanaMemoField';

describe('SolanaMemoField', () => {
    it('renders the value and reports edits', async () => {
        const onChange = jest.fn();
        await renderWithBasicProvider(<SolanaMemoField value="hi" onChange={onChange} />);

        expect(screen.getByLabelText('Memo')).toHaveProp('value', 'hi');

        await fireEvent.changeText(screen.getByLabelText('Memo'), 'hello');

        expect(onChange).toHaveBeenCalledWith('hello');
    });

    it('shows the too-long message the form passes', async () => {
        await renderWithBasicProvider(
            <SolanaMemoField value="x" onChange={jest.fn()} error="too-long" />,
        );

        expect(screen.getByText('Memo is too long.')).toBeTruthy();
    });
});
