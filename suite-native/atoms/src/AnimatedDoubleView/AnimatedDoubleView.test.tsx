import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { Box } from '../Box';
import { AnimatedDoubleView, type AnimatedDoubleViewProps } from './AnimatedDoubleView';

describe('AnimatedDoubleView', () => {
    const renderAnimatedDoubleView = async (props: Partial<AnimatedDoubleViewProps>) =>
        await renderWithBasicProvider(
            <AnimatedDoubleView
                renderPrimary={() => <Box accessibilityLabel="PRIMARY_VIEW" />}
                renderSecondary={() => <Box accessibilityLabel="SECONDARY_VIEW" />}
                {...props}
            />,
        );

    it('should render primary and secondary component and switcher in between', async () => {
        const { getByLabelText } = await renderAnimatedDoubleView({});

        expect(getByLabelText('PRIMARY_VIEW')).toBeOnTheScreen();
        expect(getByLabelText('SECONDARY_VIEW')).toBeOnTheScreen();
        expect(getByLabelText('Switch')).toBeOnTheScreen();
    });

    it('should call onViewSwitch when Switch button is pressed', async () => {
        const onViewSwitch = jest.fn();
        const { getByLabelText } = await renderAnimatedDoubleView({ onViewSwitch });

        const switchButton = getByLabelText('Switch');
        await fireEvent.press(switchButton);
        await fireEvent.press(switchButton);

        expect(onViewSwitch).toHaveBeenCalledTimes(2);
        expect(onViewSwitch).toHaveBeenNthCalledWith(1, 'secondary');
        expect(onViewSwitch).toHaveBeenNthCalledWith(2, 'primary');
    });

    it('should display the controlled active view', async () => {
        const { getByLabelText } = await renderWithBasicProvider(
            <AnimatedDoubleView
                activeView="secondary"
                renderPrimary={({ isDisabled }) => (
                    <Box accessibilityLabel={isDisabled ? 'PRIMARY_DISABLED' : 'PRIMARY_ACTIVE'} />
                )}
                renderSecondary={({ isDisabled }) => (
                    <Box
                        accessibilityLabel={isDisabled ? 'SECONDARY_DISABLED' : 'SECONDARY_ACTIVE'}
                    />
                )}
            />,
        );

        expect(getByLabelText('PRIMARY_DISABLED')).toBeOnTheScreen();
        expect(getByLabelText('SECONDARY_ACTIVE')).toBeOnTheScreen();
    });

    it('should propagate switch label', async () => {
        const switchLabel = 'Custom Switch Label';
        const { getByLabelText, queryByLabelText } = await renderAnimatedDoubleView({
            switchLabel,
        });

        expect(queryByLabelText('Switch')).toBeNull();
        expect(getByLabelText(switchLabel)).toBeOnTheScreen();
    });

    it('should switch active view on second view press', async () => {
        const onViewSwitch = jest.fn();
        const { getByLabelText } = await renderAnimatedDoubleView({ onViewSwitch });

        await fireEvent.press(getByLabelText('SECONDARY_VIEW'));
        await fireEvent.press(getByLabelText('PRIMARY_VIEW'));

        expect(onViewSwitch).toHaveBeenCalledTimes(2);
        expect(onViewSwitch).toHaveBeenNthCalledWith(1, 'secondary');
        expect(onViewSwitch).toHaveBeenNthCalledWith(2, 'primary');
    });

    it('should do nothing when pressing active view', async () => {
        const onViewSwitch = jest.fn();
        const { getByLabelText } = await renderAnimatedDoubleView({ onViewSwitch });

        await fireEvent.press(getByLabelText('PRIMARY_VIEW'));
        await fireEvent.press(getByLabelText('Switch'));
        await fireEvent.press(getByLabelText('SECONDARY_VIEW'));

        expect(onViewSwitch).toHaveBeenCalledTimes(1);
        expect(onViewSwitch).toHaveBeenNthCalledWith(1, 'secondary');
    });
});
