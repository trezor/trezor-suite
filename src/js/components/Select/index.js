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
    control: (base, state) => ({
        ...base,
        borderRadius: '2px',
        // state.onHover: () => {
        //     borderColor: colors.DIVIDER,
        // },
        borderColor: state.hover ? colors.DIVIDER : colors.DIVIDER,
    }),
    option: base => ({
        ...base,
        color: colors.TEXT_SECONDARY,
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: base => ({
        ...base,
        color: colors.TEXT_SECONDARY,
        path: '',
    }),
};

const SelectWrapper = props => (
    <Select
        styles={styles}
        {...props}
    />
);

export default SelectWrapper;
