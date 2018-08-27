import React from 'react';
import Select from 'react-select';
import colors from 'config/colors';

// const SelectWrapper = styled(Select)`
//     width: 200px;
//     height: 40px;
//     margin-right: 4px;

//     .Select-control {
//         width: 200px;
//         height: 40px;
//         border: 1px solid ${colors.DIVIDER};
//         border-radius: 0px 2px 2px 0px;
//         background: ${colors.WHITE};
//     }

//     .Select-option {
//         ${TRANSITION.HOVER};
//         &.is-focused {
//             background: ${colors.GRAY_LIGHT};
//         }

//         &.is-selected {
//             background: ${colors.DIVIDER};
//         }
//     }
// `;

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
    <Select
        styles={styles}
        {...props}
    />
);

export default SelectWrapper;
