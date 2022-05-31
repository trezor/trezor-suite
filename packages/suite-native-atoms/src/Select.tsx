import React, { ReactNode, useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from './Box';
import { SelectItem, SelectItemProps } from './SelectItem';
import { SelectList } from './SelectList';
import { Text } from './Text';
import { Icon } from './Icon/Icon';

type SelectItem = {
    label: string;
    value: string;
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
    borderWidth: utils.borders.widths.sm,
    borderRadius: utils.borders.radii.basic,
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

    useEffect(() => {
        console.log(selectedItem, 'item selected');
    }, [selectedItem]);

    const handleSelectItem = (value: string) => {
        setSelectedItem(value);
        setIsOpen(false);
    };

    const getLabel = (): string => {
        if (!selectedItem) return label;
        return items.find(item => item.value === selectedItem)?.label ?? label;
    };

    return (
        <Box>
            <Box>
                {isOpen && (
                    <SelectList onClose={() => setIsOpen(false)}>
                        {items.map((item, index) => (
                            <SelectItem
                                key={item.value}
                                label={item.label}
                                value={item.value}
                                isSelected={item.value === selectedItem}
                                isLastChild={index === items.length - 1}
                                onSelect={() => handleSelectItem(item.value)}
                            />
                        ))}
                    </SelectList>
                )}
            </Box>
            {!isOpen && (
                <TouchableOpacity onPress={() => setIsOpen(true)} style={applyStyle(selectStyle)}>
                    <Text numberOfLines={1}>{getLabel()}</Text>
                    <Icon type="chevronDown" />
                </TouchableOpacity>
            )}
        </Box>
    );
};
