import { ReactNode } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Box } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-common/icons-deprecated';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SettingsSectionItemIcon } from './SettingsSectionItemIcon';
import { SettingsSectionItemText } from './SettingsSectionItemText';

export type SettingsSectionItemProps = {
    iconName: IconName;
    title: ReactNode;
    subtitle?: ReactNode;
    onPress?: () => void;
    testID?: string;
};

const listItemRightArrowContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: utils.spacings.medium,
}));

export const SettingsSectionItem = ({
    title,
    subtitle,
    iconName,
    onPress,
    testID,
}: SettingsSectionItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity disabled={!onPress} onPress={onPress} testID={testID}>
            <Box flexDirection="row">
                <SettingsSectionItemIcon iconName={iconName} />
                <SettingsSectionItemText title={title} subtitle={subtitle} />
                <View style={applyStyle(listItemRightArrowContainerStyle)}>
                    <Icon name="circleRightLight" color="iconPrimaryDefault" />
                </View>
            </Box>
        </TouchableOpacity>
    );
};
