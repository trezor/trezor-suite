import { type ReactNode } from 'react';

import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from './Box';
import { Text } from './Text';

type ErrorMessageProps = {
    errorMessage: ReactNode;
};

const errorMessageStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.legacyBackgroundAlertRedSubtleOnElevation0,
    margin: utils.spacings.sp8,
    borderColor: utils.colors.elementBorderFieldError,
    borderWidth: 1,
    borderRadius: utils.borders.radii.r16,
    padding: utils.spacings.sp24,
}));

export const ErrorMessage = ({ errorMessage }: ErrorMessageProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(errorMessageStyle)}>
            <Box marginRight="sp8">
                <Icon name="warningCircle" size="large" color="contentCritical" />
            </Box>
            <Text color="contentCritical">Error: {errorMessage}</Text>
        </Box>
    );
};
