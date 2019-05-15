import PropTypes from 'prop-types';
import React from 'react';
import ReactAsyncSelect from 'react-select/lib/Async';
import ReactSelect from 'react-select';
import colors from '../../config/colors';

//TODO: proper type checking with types imported from react-select

const styles = (isSearchable: boolean, withDropdownIndicator: boolean = true) => ({
    singleValue: (base: Object) => ({
        ...base,
        maxWidth: 'calc(100% - 10px)', // 8px padding + 2px maring-left
        width: '100%',
        color: colors.TEXT_SECONDARY,
        '&:hover': {
            cursor: isSearchable ? 'text' : 'pointer',
        },
    }),
    control: (base: Object, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        minHeight: 'initial',
        height: '40px',
        borderRadius: '2px',
        borderColor: colors.DIVIDER,
        boxShadow: 'none',
        background: isDisabled ? colors.SELECT_HOVER : colors.WHITE,
        '&:hover': {
            cursor: 'pointer',
            borderColor: colors.DIVIDER,
        },
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base: Object, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        display: !withDropdownIndicator || isDisabled ? 'none' : 'block',
        color: colors.TEXT_SECONDARY,
        path: '',
        '&:hover': {
            color: colors.TEXT_SECONDARY,
        },
    }),
    menu: (base: Object) => ({
        ...base,
        margin: 0,
        boxShadow: 'none',
    }),
    menuList: (base: Object) => ({
        ...base,
        padding: 0,
        boxShadow: 'none',
        background: colors.WHITE,
        borderLeft: `1px solid ${colors.DIVIDER}`,
        borderRight: `1px solid ${colors.DIVIDER}`,
        borderBottom: `1px solid ${colors.DIVIDER}`,
    }),
    option: (base: Object, { isFocused }: { isFocused: boolean }) => ({
        ...base,
        color: colors.TEXT_SECONDARY,
        background: isFocused ? colors.SELECT_HOVER : colors.WHITE,
        borderRadius: 0,
        '&:hover': {
            cursor: 'pointer',
            background: colors.SELECT_HOVER,
        },
    }),
});

interface Props {
    isSearchable: boolean;
    withDropdownIndicator: boolean;
}

interface AsyncProps extends Props {
    loadOptions: (inputValue: string, callback: (options: any) => void) => Promise<any> | void;
}

const propTypes = {
    isAsync: PropTypes.bool,
    isSearchable: PropTypes.bool,
    withDropdownIndicator: PropTypes.bool,
};
const Select = ({ isSearchable = true, withDropdownIndicator = true, ...rest }: Props) => (
    <ReactSelect
        styles={styles(isSearchable, withDropdownIndicator)}
        isSearchable={isSearchable}
        {...rest}
    />
);
const AsyncSelect = ({
    isSearchable = true,
    withDropdownIndicator = true,
    loadOptions,
    ...rest
}: AsyncProps) => (
    <ReactAsyncSelect
        styles={styles(isSearchable, withDropdownIndicator)}
        isSearchable={isSearchable}
        loadOptions={loadOptions}
        {...rest}
    />
);

Select.propTypes = propTypes;
AsyncSelect.propTypes = propTypes;

export { Select, AsyncSelect };
