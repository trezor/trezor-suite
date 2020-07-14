import React from 'react';
import ReactSelect, { components, Props as SelectProps } from 'react-select';
import { colors, variables } from '../../../config';
import { InputVariant } from '../../../support/types';

const selectStyle = (isSearchable: boolean, isHovered: boolean, minWidth = '50px') => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        color: colors.NEUE_TYPE_LIGHT_GREY,
        border: 0,
    }),
    container: (base: Record<string, any>) => ({
        ...base,
        border: 0,
    }),
    control: (base: Record<string, any>) => {
        return {
            ...base,
            boxShadow: '0',
            height: 22,
            border: 0,
        };
    },
    valueContainer: (base: Record<string, any>) => ({
        ...base,
        border: 0,
        paddingRight: 3,
        marginTop: 1,
        fontWeight: variables.FONT_WEIGHT.MEDIUM,
        color: colors.NEUE_TYPE_LIGHT_GREY,
        minWidth,
        display: 'flex',
        justifyContent: 'flex-end',
    }),
    indicatorSeparator: (base: Record<string, any>) => {
        return {
            display: 'none',
        };
    },
    dropdownIndicator: (base: Record<string, any>) => {
        return {
            ...base,
            padding: 0,
            margin: 0,
            border: '0',
        };
    },
    menu: (base: Record<string, any>) => ({
        ...base,
        color: colors.NEUE_TYPE_LIGHT_GREY,
    }),
    menuList: (base: Record<string, any>) => ({
        ...base,
    }),
    option: (base: Record<string, any>) => ({
        ...base,
    }),
});

interface Props extends Omit<SelectProps, 'components'> {
    withDropdownIndicator?: boolean;
    isClean?: boolean;
    label?: React.ReactNode;
    wrapperProps?: Record<string, any>;
    variant?: InputVariant;
    minWidth?: string;
}

const SelectInput = ({
    isSearchable = true,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    isClean = false,
    label,
    minWidth,
    ...props
}: Props) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <ReactSelect
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            styles={selectStyle(isSearchable, isHovered, minWidth)}
            isSearchable={false}
            {...props}
        />
    );
};

export { SelectInput, Props as SelectInputProps };
