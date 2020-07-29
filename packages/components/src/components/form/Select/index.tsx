import React from 'react';
import ReactSelect, { components, Props as SelectProps } from 'react-select';
import styled from 'styled-components';
import { colors, variables } from '../../../config';
import { InputVariant } from '../../../support/types';

const selectStyle = (
    isSearchable: boolean,
    withDropdownIndicator = true,
    variant: InputVariant,
    isClean: boolean
) => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        color: colors.BLACK0,
        '&:hover': {
            cursor: isSearchable ? 'text' : 'pointer',
        },
    }),
    control: (
        base: Record<string, any>,
        { isDisabled, isFocused }: { isDisabled: boolean; isFocused: boolean }
    ) => {
        return {
            ...base,
            minHeight: 'initial',
            display: 'flex',
            alignItems: 'center',
            fontSize: variables.FONT_SIZE.SMALL,
            height: variant === 'small' ? '36px' : '48px',
            borderRadius: '4px',
            borderWidth: '2px',
            borderColor: colors.NEUE_STROKE_GREY,
            boxShadow: 'none',
            '&:hover, &:focus': {
                cursor: 'pointer',
                borderRadius: '4px',
                borderWidth: '2px',
                borderColor: colors.NEUE_STROKE_GREY,
            },
        };
    },
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base: Record<string, any>, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        display: !withDropdownIndicator || isDisabled ? 'none' : 'flex',
        alignItems: 'center',
        color: colors.BLACK50,
        path: '',
        '&:hover': {
            color: colors.BLACK0,
        },
    }),
    menu: (base: Record<string, any>) => ({
        ...base,
        margin: '5px 0',
        boxShadow: 'box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.15)',
        zIndex: 9,
    }),
    menuList: (base: Record<string, any>) => ({
        ...base,
        padding: 0,
        boxShadow: 'none',
        background: colors.WHITE,
        border: `1px solid ${colors.BLACK80}`,
        borderRadius: '3px',
    }),
    option: (base: Record<string, any>, { isFocused }: { isFocused: boolean }) => ({
        ...base,
        color: colors.BLACK0,
        background: isFocused ? colors.BLACK96 : colors.WHITE,
        borderRadius: 0,
        '&:hover': {
            cursor: 'pointer',
            background: colors.BLACK96,
        },
    }),
});

const Wrapper = styled.div<Props>`
    width: ${props => (props.width ? `${props.width}px` : '100%')};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const Label = styled.span`
    min-height: 32px;
`;

interface Props extends Omit<SelectProps, 'components'> {
    withDropdownIndicator?: boolean;
    isClean?: boolean;
    label?: React.ReactNode;
    wrapperProps?: Record<string, any>;
    variant?: InputVariant;
    noTopLabel?: boolean;
}

const Select = ({
    isSearchable = true,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    isClean = false,
    label,
    width,
    variant = 'large',
    noTopLabel = false,
    ...props
}: Props) => {
    // customize control to pass data-test attribute
    const Control = (controlProps: any) => {
        return (
            <components.Control
                {...controlProps}
                innerProps={{
                    ...controlProps.innerProps,
                    'data-test': `${props['data-test']}/input`,
                }}
            />
        );
    };

    // customize options to pass data-test attribute
    const Option = (optionProps: any) => {
        return (
            <components.Option
                {...optionProps}
                innerProps={{
                    ...optionProps.innerProps,
                    'data-test': `${props['data-test']}/option/${optionProps.value}`,
                }}
            />
        );
    };

    return (
        <Wrapper className={className} width={width} {...wrapperProps}>
            {!noTopLabel && <Label>{label}</Label>}
            <ReactSelect
                styles={selectStyle(isSearchable, withDropdownIndicator, variant, isClean)}
                isSearchable={isSearchable}
                {...props}
                components={{ Control, Option, ...props.components }}
            />
        </Wrapper>
    );
};

export { Select, Props as SelectProps };
