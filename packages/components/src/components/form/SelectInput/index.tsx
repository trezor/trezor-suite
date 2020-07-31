import React from 'react';
import styled from 'styled-components';
import ReactSelect, { Props as SelectProps } from 'react-select';
import { colors, variables } from '../../../config';
import { InputVariant } from '../../../support/types';

const Wrapper = styled.div``;

const getDropdownVisibility = (isDisabled: boolean, isFocused: boolean, isHovered: boolean) => {
    if (isDisabled) {
        return 'none';
    }

    if (isFocused || isHovered) {
        return 'flex';
    }

    return 'none';
};

const selectStyle = (isSearchable: boolean, isHovered: boolean, minWidth = '50px') => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        color: colors.NEUE_TYPE_LIGHT_GREY,
        border: 0,
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
    }),
    container: (base: Record<string, any>) => ({
        ...base,
        border: 0,
        cursor: 'pointer',
    }),
    control: (base: Record<string, any>) => {
        return {
            ...base,
            boxShadow: '0',
            background: 'transparent',
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
    dropdownIndicator: (
        base: Record<string, any>,
        { isFocused, isDisabled }: { isFocused: boolean; isDisabled: boolean }
    ) => {
        return {
            ...base,
            padding: 0,
            margin: 0,
            border: '0',
            display: getDropdownVisibility(isDisabled, isFocused, isHovered),
        };
    },
    menu: (base: Record<string, any>) => ({
        ...base,
        color: colors.NEUE_TYPE_LIGHT_GREY,
        background: 'white',
        boxShadow: '0 4px 10px 0 rgba(0, 0, 0, 0.15)',
    }),
    menuList: (base: Record<string, any>) => ({
        ...base,
    }),
    option: (base: Record<string, any>, { isFocused }: { isFocused: boolean }) => ({
        ...base,
        background: isFocused ? colors.BLACK96 : colors.WHITE,
        color: colors.NEUE_TYPE_DARK_GREY,
        fontSize: variables.FONT_SIZE.SMALL,
        fontWeight: variables.FONT_WEIGHT.MEDIUM,
        '&:hover': {
            cursor: 'pointer',
            background: colors.NEUE_BG_GRAY,
        },
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
    options,
    ...props
}: Props) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const optionsLength = options.length;

    return (
        <Wrapper onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <ReactSelect
                styles={selectStyle(isSearchable, isHovered, minWidth)}
                isSearchable={isSearchable}
                isDisabled={optionsLength <= 1}
                options={options}
                {...props}
            />
        </Wrapper>
    );
};

export { SelectInput, Props as SelectInputProps };
