import React, { ReactNode, useState } from 'react';
import { Box } from './Box';
import { SelectItem, SelectItemProps } from './SelectItem';
import { TouchableOpacity } from 'react-native';
import { SelectList } from './SelectList';
import { Text } from './Text';

type SelectProps = {
    items: SelectItemProps[];
    label: ReactNode;
};

export const Select = ({ items, label }: SelectProps) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<null | SelectItemProps['value']>(null);
    return (
        <Box>
            <Box>
                {isOpen && (
                    <SelectList onClose={() => setIsOpen(false)}>
                        {items.map(({ label, value }: SelectItemProps, index) => (
                            <SelectItem
                                key={value}
                                label={label}
                                value={value}
                                isSelected={value === selectedItem}
                                isLastChild={index === items.length - 1}
                                onSelect={() => setSelectedItem(value)}
                            />
                        ))}
                    </SelectList>
                )}
            </Box>
            {!isOpen && (
                <TouchableOpacity onPress={() => setIsOpen(true)}>
                    <Text>{label}</Text>
                </TouchableOpacity>
            )}
        </Box>
    );
};
