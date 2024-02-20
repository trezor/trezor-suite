import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-common/icons';

import { Box } from './Box';
import { Text } from './Text';

type ErrorMessageProps = {
    errorMessage: string;
};

const errorMessageStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundAlertRedSubtleOnElevation0,
    margin: utils.spacings.small,
    borderColor: utils.colors.borderAlertRed,
    borderWidth: 1,
    borderRadius: utils.borders.radii.medium,
    padding: utils.spacings.large,
}));

export const ErrorMessage = ({ errorMessage }: ErrorMessageProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(errorMessageStyle)}>
            <Box marginRight="small">
                <Icon name="warningCircle" size="large" color="iconAlertRed" />
            </Box>
            <Text color="textAlertRed">Error: {errorMessage}</Text>
        </Box>
    );
};
