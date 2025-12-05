import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { G } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Radio } from '../Radio';
import { Text } from '../Text';

export type SelectItemValue = string | number;
export type SelectItemProps = {
    label: string;
    value: SelectItemValue;
    onSelect: () => void;
    isSelected: boolean;
    icon?: ReactNode;
};

type SelectItemStyleProps = {
    isSelected: boolean;
};

const selectItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    ...utils.boxShadows.small,
}));

const selectItemContentStyle = prepareNativeStyle<SelectItemStyleProps>(
    (utils, { isSelected }) => ({
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: utils.spacings.sp16,
        borderWidth: utils.borders.widths.large,
        borderRadius: utils.borders.radii.r12,
        borderColor: utils.colors.backgroundSurfaceElevation1,
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        color: utils.colors.textDefault,
        extend: [
            {
                condition: isSelected,
                style: {
                    borderColor: utils.colors.backgroundPrimaryDefault,
                    color: utils.colors.textDefault,
                },
            },
        ],
    }),
);

export const SelectItem = ({ label, value, onSelect, isSelected, icon }: SelectItemProps) => {
    const { applyStyle } = useNativeStyles();

    if (G.isNullable(value)) return null;

    return (
        <TouchableOpacity
            style={applyStyle(selectItemStyle)}
            onPress={onSelect}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
            testID={`@select/item/${value}`}
        >
            {icon}
            <Box
                style={applyStyle(selectItemContentStyle, { isSelected })}
                testID={`@select/item/${value}/content`}
            >
                <Text numberOfLines={1}>{label}</Text>
                <Radio value={value} onPress={onSelect} isChecked={isSelected} />
            </Box>
        </TouchableOpacity>
    );
};
