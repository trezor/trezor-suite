import { type ReactNode } from 'react';

import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { PressableOpacity } from '../Pressable';
import { HStack } from '../Stack';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';

type SelectTriggerProps = {
    label?: ReactNode;
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
    borderRadius: utils.borders.radii.r12,
    borderColor: utils.colors.borderInputDefault,
    color: utils.colors.textSubdued,
    paddingLeft: utils.spacings.sp12,
    paddingRight: 23.25,
    height: SELECT_HEIGHT,
}));

export const SelectTrigger = ({ label, value, icon, handlePress, testID }: SelectTriggerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity onPress={handlePress} style={applyStyle(selectStyle)} testID={testID}>
            <Box>
                {label && (
                    <Text variant="body-xs" color="textSubdued">
                        {label}
                    </Text>
                )}
                <HStack alignItems="center">
                    {icon}
                    <Text numberOfLines={1} ellipsizeMode="tail">
                        {value}
                    </Text>
                </HStack>
            </Box>
            <Icon size="large" color="iconSubdued" name="caretDown" />
        </PressableOpacity>
    );
};
