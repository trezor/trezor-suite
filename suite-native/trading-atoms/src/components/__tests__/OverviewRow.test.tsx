import { Text } from '@suite-native/atoms';
import { fireEvent, renderWithProviders } from '@suite-native/test-utils';

import { OverviewRow } from '../OverviewRow';

describe('OverviewRow', () => {
    it('should use title as left text as well as a11yLabel', () => {
        const { getByText, getByLabelText } = renderWithProviders(
            <OverviewRow title="Title" onPress={jest.fn()}>
                <Text>Child</Text>
            </OverviewRow>,
            { providers: ['intl'] },
        );

        expect(getByText('Title')).toBeTruthy();
        expect(getByLabelText('Title')).toBeTruthy();
    });

    it('should call onPress callback when clicked', () => {
        const onPress = jest.fn();
        const { getByText } = renderWithProviders(
            <OverviewRow title="Title" onPress={onPress}>
                <Text>Child</Text>
            </OverviewRow>,
            { providers: ['intl'] },
        );

        fireEvent.press(getByText('Title'));

        expect(onPress).toHaveBeenCalledWith();
    });

    it('should render warning when added', () => {
        const { queryByHintText } = renderWithProviders(
            <OverviewRow title="Title" warning="Warning message">
                <Text>Child</Text>
            </OverviewRow>,
            { providers: ['intl'] },
        );

        expect(queryByHintText('Warning')).toHaveTextContent(/^.Warning message$/);
    });

    it('should not render warning when not added', () => {
        const { queryByHintText } = renderWithProviders(
            <OverviewRow title="Title">
                <Text>Child</Text>
            </OverviewRow>,
            { providers: ['intl'] },
        );

        expect(queryByHintText('Warning')).not.toBeOnTheScreen();
    });
});
