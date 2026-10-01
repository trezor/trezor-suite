import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { SolanaPriorityFeeSelector } from './SolanaPriorityFeeSelector';

const levels = [
    { id: 'none', value: '0' },
    { id: 'high', value: '10000' },
];

describe('SolanaPriorityFeeSelector', () => {
    it('lists the levels it is given and reports a selection', async () => {
        const onSelect = jest.fn();
        await renderWithBasicProvider(
            <SolanaPriorityFeeSelector
                levels={levels}
                selectedLevelId="none"
                onSelect={onSelect}
            />,
        );

        expect(screen.getByLabelText('No priority: 0 lamports')).toBeChecked();
        expect(screen.getByLabelText('High priority: 10000 lamports')).not.toBeChecked();

        await fireEvent.press(screen.getByLabelText('High priority: 10000 lamports'));

        expect(onSelect).toHaveBeenCalledWith('high');
    });
});
