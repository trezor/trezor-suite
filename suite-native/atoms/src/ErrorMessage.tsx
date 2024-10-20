import { ReactNode } from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@suite-native/icons';

import { Box } from './Box';
import { Text } from './Text';

type ErrorMessageProps = {
    errorMessage: ReactNode;
};

const errorMessageStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundAlertRedSubtleOnElevation0,
    margin: utils.spacings.sp8,
    borderColor: utils.colors.borderAlertRed,
    borderWidth: 1,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp24,
}));

export const ErrorMessage = ({ errorMessage }: ErrorMessageProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(errorMessageStyle)}>
            <Box marginRight="sp8">
                <Icon name="warningCircle" size="large" color="iconAlertRed" />
            </Box>
            <Text color="textAlertRed">Error: {errorMessage}</Text>
        </Box>
    );
};
