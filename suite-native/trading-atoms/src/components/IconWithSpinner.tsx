import { Box, CircularSpinner } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type IconWithSpinnerProps = {
    isInProgress?: boolean;
    iconName: IconName;
};

const iconWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.round,
    padding: utils.spacings.sp12,
    alignItems: 'center',
    justifyContent: 'center',
}));

export const IconWithSpinner = ({ iconName, isInProgress = true }: IconWithSpinnerProps) => {
    const { applyStyle, utils } = useNativeStyles();

    return (
        <Box style={applyStyle(iconWrapperStyle)}>
            <Icon name={iconName} size="extraLarge" />
            {isInProgress && (
                <CircularSpinner
                    size={utils.spacings.sp56}
                    color="legacyBackgroundAlertYellowBold"
                    width={3}
                />
            )}
        </Box>
    );
};
