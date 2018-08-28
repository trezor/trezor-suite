import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import AsyncSelect from 'react-select/lib/Async';
import colors from 'config/colors';

const styles = {
    singleValue: base => ({
        ...base,
        color: colors.TEXT_SECONDARY,
    }),
    container: base => ({
        ...base,
        width: '180px',
    }),
    control: (base, { isDisabled }) => ({
        ...base,
        borderRadius: '2px',
        borderColor: colors.DIVIDER,
        boxShadow: 'none',
        background: isDisabled ? colors.LANDING : colors.WHITE,
        '&:hover': {
            cursor: 'pointer',
            borderColor: colors.DIVIDER,
        },
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: base => ({
        ...base,
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
    }),
    option: (base, { isSelected }) => ({
        ...base,
        color: colors.TEXT_SECONDARY,
        background: isSelected ? colors.LANDING : colors.WHITE,
        borderRadius: 0,
        borderLeft: `1px solid ${colors.DIVIDER}`,
        borderRight: `1px solid ${colors.DIVIDER}`,
        '&:last-child': {
            borderBottom: `1px solid ${colors.DIVIDER}`,
        },
        '&:hover': {
            cursor: 'pointer',
            background: colors.LANDING,
        },
    }),
};

const SelectWrapper = props => (
    <div>
        {props.isAsync && <AsyncSelect styles={styles} {...props} /> }
        {!props.isAsync && <Select styles={styles} {...props} />}
    </div>
);

SelectWrapper.propTypes = {
    isAsync: PropTypes.bool,
};

SelectWrapper.defaultProps = {
    isAsync: false,
};

export default SelectWrapper;
