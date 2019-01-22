import React from 'react';
import PropTypes from 'prop-types';
import ReactSelect from 'react-select';
import ReactAsyncSelect from 'react-select/lib/Async';
import colors from 'config/colors';

const styles = isSearchable => ({
    singleValue: base => ({
        ...base,
        maxWidth: 'calc(100% - 10px)', // 8px padding + 2px maring-left
        width: '100%',
        color: colors.TEXT_SECONDARY,
    }),
    control: (base, { isDisabled, isFocused }) => ({
        ...base,
        minHeight: 'initial',
        height: '40px',
        borderRadius: '2px',
        borderColor: isFocused ? colors.INPUT_FOCUSED_BORDER : colors.DIVIDER,
        boxShadow: isFocused ? `0 0px 6px 0 ${colors.INPUT_FOCUSED_SHADOW}` : 'none',
        background: isDisabled ? colors.LANDING : colors.WHITE,
        '&:hover': {
            cursor: isSearchable ? 'text' : 'pointer',
        },
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base, { isDisabled }) => ({
        ...base,
        display: (isSearchable || isDisabled) ? 'none' : 'block',
        color: colors.TEXT_SECONDARY,
        path: '',
        '&:hover': {
            color: colors.TEXT_SECONDARY,
        },
    }),
    menu: base => ({
        ...base,
        margin: 0,
        boxShadow: 'none',
    }),
    menuList: base => ({
        ...base,
        padding: 0,
        boxShadow: 'none',
        background: colors.WHITE,
        borderLeft: `1px solid ${colors.DIVIDER}`,
        borderRight: `1px solid ${colors.DIVIDER}`,
        borderBottom: `1px solid ${colors.DIVIDER}`,
    }),
    option: (base, { isFocused }) => ({
        ...base,
        color: colors.TEXT_SECONDARY,
        background: isFocused ? colors.LANDING : colors.WHITE,
        borderRadius: 0,
        '&:hover': {
            cursor: 'pointer',
            background: colors.LANDING,
        },
    }),
});

const propTypes = {
    isAsync: PropTypes.bool,
    isSearchable: PropTypes.bool,
};
const Select = props => <ReactSelect styles={styles(props.isSearchable)} {...props} />;
const AsyncSelect = props => <ReactAsyncSelect styles={styles(props.isSearchable)} {...props} />;
Select.propTypes = propTypes;
AsyncSelect.propTypes = propTypes;

export {
    Select,
    AsyncSelect,
};
