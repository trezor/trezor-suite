import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const connectorStyle = prepareNativeStyle<{ isCompleted: boolean }>(
    ({ colors, spacings }, { isCompleted }) => ({
        width: spacings.sp4,
        height: spacings.sp16,
        marginVertical: spacings.sp1,
        marginLeft: spacings.sp24,
        backgroundColor: isCompleted ? colors.borderBrand : colors.borderNeutral,
    }),
);

type StepCardConnectorProps = {
    isCompleted: boolean;
};

export const StepCardConnector = ({ isCompleted }: StepCardConnectorProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box
            style={applyStyle(connectorStyle, { isCompleted })}
            testID={`@step-cards/connector/${isCompleted ? 'completed' : 'pending'}`}
        />
    );
};
