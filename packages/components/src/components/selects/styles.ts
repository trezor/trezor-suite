import colors from '../../config/colors';

const styles = (isSearchable: boolean, withDropdownIndicator = true) => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        maxWidth: 'calc(100% - 10px)', // 8px padding + 2px maring-left
        width: '100%',
        color: colors.TEXT_SECONDARY,
        '&:hover': {
            cursor: isSearchable ? 'text' : 'pointer',
        },
    }),
    control: (base: Record<string, any>, { isDisabled }: { isDisabled: boolean }) => ({
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
        ' > div': {
            overflow: 'visible',
        },
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base: Record<string, any>, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        display: !withDropdownIndicator || isDisabled ? 'none' : 'block',
        color: colors.TEXT_SECONDARY,
        path: '',
        '&:hover': {
            color: colors.TEXT_SECONDARY,
        },
    }),
    menu: (base: Record<string, any>) => ({
        ...base,
        margin: 0,
        boxShadow: 'none',
    }),
    menuList: (base: Record<string, any>) => ({
        ...base,
        padding: 0,
        boxShadow: 'none',
        background: colors.WHITE,
        borderLeft: `1px solid ${colors.DIVIDER}`,
        borderRight: `1px solid ${colors.DIVIDER}`,
        borderBottom: `1px solid ${colors.DIVIDER}`,
    }),
    option: (base: Record<string, any>, { isFocused }: { isFocused: boolean }) => ({
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

export default styles;
