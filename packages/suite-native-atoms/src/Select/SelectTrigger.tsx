import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';
import { SelectItem } from './selectTypes';

type SelectTriggerProps = {
    selectedItem: SelectItem | null;
    label: string;
    icon: ReactNode;
    handlePress: () => void;
};

const selectStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: utils.colors.gray200,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.small,
    borderColor: utils.colors.gray200,
    color: utils.colors.gray600,
    paddingLeft: 12,
    paddingRight: 23.25,
    height: 58,
}));

export const SelectTrigger = ({ selectedItem, label, icon, handlePress }: SelectTriggerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity onPress={handlePress} style={applyStyle(selectStyle)}>
            <Box>
                {!!selectedItem && (
                    <Text variant="label" color="gray600">
                        {label}
                    </Text>
                )}
                <Box flexDirection="row">
                    {selectedItem && <Box marginRight="sm">{icon}</Box>}
                    <Text color="gray700" numberOfLines={1}>
                        {selectedItem?.label ?? label}
                    </Text>
                </Box>
            </Box>
            <Icon size="medium" color="gray600" name="chevronDown" />
        </TouchableOpacity>
    );
};
