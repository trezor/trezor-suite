import React from 'react';
import ReactSelect, { Props as SelectProps } from 'react-select';
import styled from 'styled-components';
import { colors, variables } from '../../../config';
import { InputDisplay, InputVariant } from '../../../support/types';

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
        let backgroundImage = isFocused
            ? `linear-gradient(to top, ${colors.WHITE}, ${colors.BLACK96})`
            : `linear-gradient(to top, ${colors.BLACK96}, ${colors.WHITE})`;
        if (isDisabled) {
            backgroundImage = `linear-gradient(to top, ${colors.BLACK92}, ${colors.BLACK92})`;
        }
        if (isClean) {
            backgroundImage = 'none';
        }
        return {
            ...base,
            minHeight: 'initial',
            display: 'flex',
            alignItems: 'center',
            height: variant === 'small' ? '38px' : '48px',
            borderRadius: '3px',
            borderColor: isClean ? 'white' : colors.BLACK80,
            boxShadow: 'none',
            backgroundImage,
            '&:hover, &:focus': {
                cursor: 'pointer',
                borderColor: isClean ? 'white' : colors.BLACK50,
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

const TopLabel = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    padding: 0 0 10px 0;
`;

interface Props extends Omit<SelectProps, 'components'> {
    withDropdownIndicator?: boolean;
    isClean?: boolean;
    topLabel?: React.ReactNode;
    wrapperProps?: Record<string, any>;
    display?: InputDisplay;
    variant?: InputVariant;
}

const Select = ({
    isSearchable = true,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    isClean = false,
    topLabel,
    width,
    variant = 'large',
    ...rest
}: Props) => {
    return (
        <Wrapper className={className} width={width} {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <ReactSelect
                styles={selectStyle(isSearchable, withDropdownIndicator, variant, isClean)}
                isSearchable={isSearchable}
                {...rest}
            />
        </Wrapper>
    );
};

export { Select, Props as SelectProps };
