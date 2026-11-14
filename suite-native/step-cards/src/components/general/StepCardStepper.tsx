import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

const stepperStyle = prepareNativeStyle(() => ({
    textTransform: 'uppercase',
}));

export type StepCardStepperProps = {
    stepNumber: number;
    stepCount: number;
    color: Color;
};

export const StepCardStepper = ({ stepNumber, stepCount, color }: StepCardStepperProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Text variant="body-sm-strong" color={color} style={applyStyle(stepperStyle)}>
            <Translation id="stepCards.stepper" values={{ stepNumber, stepCount }} />
        </Text>
    );
};
