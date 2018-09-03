import React from 'react';
import PropTypes from 'prop-types';
import ReactSelect from 'react-select';
import ReactAsyncSelect from 'react-select/lib/Async';
import colors from 'config/colors';
import { FONT_FAMILY } from 'config/variables';

const styles = isSearchable => ({
    singleValue: base => ({
        ...base,
        width: '100%',
        color: colors.TEXT_SECONDARY,
    }),
    control: (base, { isDisabled }) => ({
        ...base,
        fontFamily: FONT_FAMILY.MONOSPACE,
        minHeight: 'initial',
        height: '100%',
        borderRadius: '2px',
        borderColor: colors.DIVIDER,
        boxShadow: 'none',
        background: isDisabled ? colors.LANDING : colors.WHITE,
        '&:hover': {
            cursor: isSearchable ? 'text' : 'pointer',
            borderColor: colors.DIVIDER,
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
        fontFamily: FONT_FAMILY.MONOSPACE,
        boxShadow: 'none',
        background: colors.WHITE,
        borderLeft: `1px solid ${colors.DIVIDER}`,
        borderRight: `1px solid ${colors.DIVIDER}`,
        borderBottom: `1px solid ${colors.DIVIDER}`,
    }),
    option: (base, { isSelected }) => ({
        ...base,
        color: colors.TEXT_SECONDARY,
        background: isSelected ? colors.LANDING : colors.WHITE,
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
