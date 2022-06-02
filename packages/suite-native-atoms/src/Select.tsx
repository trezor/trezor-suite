import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FlagIconName, Icon } from '@trezor/icons';

import { Box } from './Box';
import { Text } from './Text';
import { BottomModal } from './Modal/BottomModal';
import { SelectItem, SelectItemProps } from './SelectItem';

export type SelectItem = {
    label: string;
    value: string;
    iconName: FlagIconName;
};

type SelectProps = {
    items: SelectItem[];
    label: string;
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

export const Select = ({ items, label }: SelectProps) => {
    const { applyStyle } = useNativeStyles();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<null | SelectItemProps['value']>(null);

    const handleSelectItem = (value: string) => {
        setSelectedItem(value);
        setIsOpen(false);
    };

    const getLabel = (): string => items.find(item => item.value === selectedItem)?.label ?? label;

    return (
        <>
            {isOpen && (
                <BottomModal
                    isVisible={isOpen}
                    onVisibilityChange={setIsOpen}
                    title="Typography Demo"
                    hasBackArrow
                    onBackArrowClick={() => setIsOpen(false)}
                >
                    {items.map(({ value, label, iconName }, index) => (
                        <SelectItem
                            key={value}
                            label={label}
                            value={value}
                            iconName={iconName}
                            isSelected={value === selectedItem}
                            isLastChild={index === items.length - 1}
                            onSelect={() => handleSelectItem(value)}
                        />
                    ))}
                </BottomModal>
            )}
            <TouchableOpacity onPress={() => setIsOpen(true)} style={applyStyle(selectStyle)}>
                <Box>
                    {!!selectedItem && (
                        <Text variant="label" color="gray600">
                            {label}
                        </Text>
                    )}
                    <Text color="gray700" numberOfLines={1}>
                        {getLabel()}
                    </Text>
                </Box>
                <Icon size="medium" color="gray600" name="chevronDown" />
            </TouchableOpacity>
        </>
    );
};
