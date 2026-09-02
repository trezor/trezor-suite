import { Text } from '@suite-native/atoms';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { OverviewRow } from './OverviewRow';

describe('OverviewRow', () => {
    it('should use title as left text as well as a11yLabel', async () => {
        const { getByText, getByLabelText } = await renderWithBasicProvider(
            <OverviewRow title="Title" onPress={jest.fn()}>
                <Text>Child</Text>
            </OverviewRow>,
        );

        expect(getByText('Title')).toBeTruthy();
        expect(getByLabelText('Title')).toBeTruthy();
    });

    it('should call onPress callback when clicked', async () => {
        const onPress = jest.fn();
        const { getByText } = await renderWithBasicProvider(
            <OverviewRow title="Title" onPress={onPress}>
                <Text>Child</Text>
            </OverviewRow>,
        );

        await fireEvent.press(getByText('Title'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should render warning when added', async () => {
        const { queryByHintText } = await renderWithBasicProvider(
            <OverviewRow title="Title" warning="Warning message">
                <Text>Child</Text>
            </OverviewRow>,
        );

        expect(queryByHintText('Warning')).toHaveTextContent(/^.Warning message$/);
    });

    it('should not render warning when not added', async () => {
        const { queryByHintText } = await renderWithBasicProvider(
            <OverviewRow title="Title">
                <Text>Child</Text>
            </OverviewRow>,
        );

        expect(queryByHintText('Warning')).not.toBeOnTheScreen();
    });
});
