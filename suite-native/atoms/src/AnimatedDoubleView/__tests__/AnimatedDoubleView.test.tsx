import { fireEvent, renderWithProviders } from '@suite-native/test-utils';

import { Box } from '../../Box';
import { AnimatedDoubleView, type AnimatedDoubleViewProps } from '../AnimatedDoubleView';

describe('AnimatedDoubleView', () => {
    const renderAnimatedDoubleView = (props: Partial<AnimatedDoubleViewProps>) =>
        renderWithProviders(
            <AnimatedDoubleView
                renderPrimary={() => <Box accessibilityLabel="PRIMARY_VIEW" />}
                renderSecondary={() => <Box accessibilityLabel="SECONDARY_VIEW" />}
                {...props}
            />,
            { providers: ['intl'] },
        );

    it('should render primary and secondary component and switcher in between', () => {
        const { getByLabelText } = renderAnimatedDoubleView({});

        expect(getByLabelText('PRIMARY_VIEW')).toBeOnTheScreen();
        expect(getByLabelText('SECONDARY_VIEW')).toBeOnTheScreen();
        expect(getByLabelText('Switch')).toBeOnTheScreen();
    });

    it('should call onViewSwitch when Switch button is pressed', () => {
        const onViewSwitch = jest.fn();
        const { getByLabelText } = renderAnimatedDoubleView({ onViewSwitch });

        const switchButton = getByLabelText('Switch');
        fireEvent.press(switchButton);
        fireEvent.press(switchButton);

        expect(onViewSwitch).toHaveBeenCalledTimes(2);
        expect(onViewSwitch).toHaveBeenNthCalledWith(1, 'secondary');
        expect(onViewSwitch).toHaveBeenNthCalledWith(2, 'primary');
    });

    it('should propagate switch label', () => {
        const switchLabel = 'Custom Switch Label';
        const { getByLabelText, queryByLabelText } = renderAnimatedDoubleView({ switchLabel });

        expect(queryByLabelText('Switch')).toBeNull();
        expect(getByLabelText(switchLabel)).toBeOnTheScreen();
    });

    it('should switch active view on second view press', () => {
        const onViewSwitch = jest.fn();
        const { getByLabelText } = renderAnimatedDoubleView({ onViewSwitch });

        fireEvent.press(getByLabelText('SECONDARY_VIEW'));
        fireEvent.press(getByLabelText('PRIMARY_VIEW'));

        expect(onViewSwitch).toHaveBeenCalledTimes(2);
        expect(onViewSwitch).toHaveBeenNthCalledWith(1, 'secondary');
        expect(onViewSwitch).toHaveBeenNthCalledWith(2, 'primary');
    });

    it('should do nothing when pressing active view', () => {
        const onViewSwitch = jest.fn();
        const { getByLabelText } = renderAnimatedDoubleView({ onViewSwitch });

        fireEvent.press(getByLabelText('PRIMARY_VIEW'));
        fireEvent.press(getByLabelText('Switch'));
        fireEvent.press(getByLabelText('SECONDARY_VIEW'));

        expect(onViewSwitch).toHaveBeenCalledTimes(1);
        expect(onViewSwitch).toHaveBeenNthCalledWith(1, 'secondary');
    });
});
