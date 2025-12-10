import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { HStack } from '../Stack';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';

type SelectTriggerProps = {
    value: string | null;
    icon?: ReactNode;
    handlePress: () => void;
    testID?: string;
};

const SELECT_HEIGHT = 58 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

const selectStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r8,
    borderColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    color: utils.colors.textSubdued,
    paddingLeft: utils.spacings.sp12,
    paddingRight: 23.25,
    height: SELECT_HEIGHT,
}));

export const SelectTrigger = ({ value, icon, handlePress, testID }: SelectTriggerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity onPress={handlePress} style={applyStyle(selectStyle)} testID={testID}>
            <HStack alignItems="center">
                {icon}
                <Text numberOfLines={1} ellipsizeMode="tail">
                    {value}
                </Text>
            </HStack>
            <Icon size="large" color="iconSubdued" name="caretDown" />
        </TouchableOpacity>
    );
};
