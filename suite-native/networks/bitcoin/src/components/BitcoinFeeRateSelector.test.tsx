import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { BitcoinFeeRateSelector } from './BitcoinFeeRateSelector';

const levels = [
    { id: 'economy', value: '1' },
    { id: 'high', value: '10' },
];

describe('BitcoinFeeRateSelector', () => {
    it('shows the selected level and reports a selection', async () => {
        const onSelect = jest.fn();
        await renderWithBasicProvider(
            <BitcoinFeeRateSelector
                levels={levels}
                selectedLevelId="economy"
                onSelect={onSelect}
            />,
        );

        expect(screen.getByText('Fee rate: 1 sat/vB')).toBeTruthy();

        await fireEvent.press(screen.getByText('Fast'));

        expect(onSelect).toHaveBeenCalledWith('high');
    });
});
