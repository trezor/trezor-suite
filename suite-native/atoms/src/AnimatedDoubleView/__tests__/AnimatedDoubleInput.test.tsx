import { renderWithProviders, userEvent } from '@suite-native/test-utils';

import { Input } from '../../Input/Input';
import { AnimatedDoubleInput, type AnimatedDoubleInputProps } from '../AnimatedDoubleInput';

describe('AnimatedDoubleInput', () => {
    const renderAnimatedDoubleInput = (props: Partial<AnimatedDoubleInputProps>) =>
        renderWithProviders(
            <AnimatedDoubleInput
                renderPrimary={({ onPress, isDisabled, inputRef }) => (
                    <Input
                        ref={inputRef}
                        onPress={onPress}
                        editable={!isDisabled}
                        value="Primary Input value"
                        label="Primary Input label"
                    />
                )}
                renderSecondary={({ onPress, isDisabled, inputRef }) => (
                    <Input
                        ref={inputRef}
                        onPress={onPress}
                        editable={!isDisabled}
                        value="Secondary Input value"
                        label="Secondary Input label"
                    />
                )}
                {...props}
            />,
            { providers: ['intl'] },
        );

    it('should call onViewSwitch when Switch button is pressed', async () => {
        const onInputSwitch = jest.fn();
        const { getByLabelText } = renderAnimatedDoubleInput({ onInputSwitch });

        const switchButton = getByLabelText('Switch');
        await userEvent.press(switchButton);

        expect(onInputSwitch).toHaveBeenCalledTimes(1);
        expect(onInputSwitch).toHaveBeenCalledWith('secondary');
    });

    it('should propagate switch label', () => {
        const switchLabel = 'Custom Switch Label';
        const { getByLabelText, queryByLabelText } = renderAnimatedDoubleInput({ switchLabel });

        expect(queryByLabelText('Switch')).toBeNull();
        expect(getByLabelText(switchLabel)).toBeOnTheScreen();
    });
});
