import { Text } from '@suite-native/atoms';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingOverviewRow } from '../OverviewRow';

describe('TradingOverviewRow', () => {
    it('should use title as left text as well as a11yLabel', () => {
        const { getByText, getByLabelText } = renderWithBasicProvider(
            <TradingOverviewRow title="Title" onPress={jest.fn()}>
                <Text>Child</Text>
            </TradingOverviewRow>,
        );

        expect(getByText('Title')).toBeTruthy();
        expect(getByLabelText('Title')).toBeTruthy();
    });

    it('should call onPress callback when clicked', () => {
        const onPress = jest.fn();
        const { getByText } = renderWithBasicProvider(
            <TradingOverviewRow title="Title" onPress={onPress}>
                <Text>Child</Text>
            </TradingOverviewRow>,
        );

        fireEvent.press(getByText('Title'));

        expect(onPress).toHaveBeenCalledWith();
    });
});
