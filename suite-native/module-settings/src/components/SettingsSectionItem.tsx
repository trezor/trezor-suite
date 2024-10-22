import { ReactNode } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

import { Box } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { SettingsSectionItemIcon } from './SettingsSectionItemIcon';
import { SettingsSectionItemText } from './SettingsSectionItemText';

export type SettingsSectionItemProps = {
    iconName: IconName;
    title: ReactNode;
    subtitle?: ReactNode;
    onPress?: () => void;
    isLoading?: boolean;
    testID?: string;
};

const listItemRightContainerStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: utils.spacings.sp16,
}));

export const SettingsSectionItem = ({
    title,
    subtitle,
    iconName,
    onPress,
    testID,
    isLoading,
}: SettingsSectionItemProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const isDisabled = !onPress || isLoading;

    return (
        <TouchableOpacity disabled={isDisabled} onPress={onPress} testID={testID}>
            <Box flexDirection="row">
                <SettingsSectionItemIcon iconName={iconName} />
                <SettingsSectionItemText title={title} subtitle={subtitle} />
                <View style={applyStyle(listItemRightContainerStyle)}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={utils.colors.iconSubdued} />
                    ) : (
                        <Icon name="caretCircleRight" color="iconPrimaryDefault" />
                    )}
                </View>
            </Box>
        </TouchableOpacity>
    );
};
