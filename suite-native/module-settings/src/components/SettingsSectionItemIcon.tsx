import { Box, RoundedIcon } from '@suite-native/atoms';
import { IconName } from '@suite-common/icons-deprecated';

type SettingsSectionItemIconProps = {
    iconName: IconName;
};

export const SettingsSectionItemIcon = ({ iconName }: SettingsSectionItemIconProps) => (
    <Box justifyContent="center" alignItems="center" marginRight="sp16">
        <RoundedIcon name={iconName} color="iconSubdued" iconSize="mediumLarge" />
    </Box>
);
