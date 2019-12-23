import React from 'react';
import ReactSelect from 'react-select';
import { Props as SelectProps } from 'react-select/lib/Select';
import styled from 'styled-components';
import colors from '../../config/colors';
import { InputDisplay } from '../../support/types';
import { getDisplayWidth } from '../../utils/display';

const selectStyle = (isSearchable: boolean, withDropdownIndicator = true) => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        maxWidth: 'calc(100% - 10px)', // 8px padding + 2px maring-left
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
        return {
            ...base,
            minHeight: 'initial',
            height: '40px',
            borderRadius: '3px',
            borderColor: colors.BLACK80,
            boxShadow: 'none',
            backgroundImage,
            '&:hover, &:focus': {
                cursor: 'pointer',
                borderColor: colors.BLACK50,
            },
            ' > div': {
                overflow: 'visible',
            },
        };
    },
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base: Record<string, any>, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        display: !withDropdownIndicator || isDisabled ? 'none' : 'block',
        color: colors.BLACK50,
        path: '',
        '&:hover': {
            color: colors.BLACK0,
        },
    }),
    menu: (base: Record<string, any>) => ({
        ...base,
        margin: '5px 0 0 0',
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
    width: ${props => getDisplayWidth(props.display || 'default')};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const TopLabel = styled.span`
    padding-bottom: 10px;
`;

interface Props extends Omit<SelectProps, 'components'> {
    isSearchable?: boolean;
    withDropdownIndicator?: boolean;
    topLabel?: React.ReactNode;
    wrapperProps?: Record<string, any>;
    display?: InputDisplay;
}

const Select = ({
    isSearchable = true,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    topLabel,
    display,
    ...rest
}: Props) => {
    return (
        <Wrapper className={className} display={display} {...wrapperProps}>
            {topLabel && <TopLabel>{topLabel}</TopLabel>}
            <ReactSelect
                styles={selectStyle(isSearchable, withDropdownIndicator)}
                isSearchable={isSearchable}
                {...rest}
            />
        </Wrapper>
    );
};

export { Select, Props as SelectProps };
