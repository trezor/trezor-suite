import colors from '../../config/colors';

const styles = (isSearchable: boolean, withDropdownIndicator = true) => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        maxWidth: 'calc(100% - 10px)', // 8px padding + 2px maring-left
        width: '100%',
        color: colors.BLACK0,
        '&:hover': {
            cursor: isSearchable ? 'text' : 'pointer',
        },
    }),
    control: (base: Record<string, any>, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        minHeight: 'initial',
        height: '40px',
        borderRadius: '3px',
        borderColor: colors.BLACK80,
        boxShadow: 'none',
        background: isDisabled ? colors.BLACK92 : 'none',
        backgroundImage: 'linear-gradient(to top, #f2f2f2, #ffffff)',
        '&:hover': {
            cursor: 'pointer',
            borderColor: colors.BLACK50,
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
        color: colors.BLACK50,
        path: '',
        '&:hover': {
            color: colors.BLACK0,
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
        borderLeft: `1px solid ${colors.BLACK80}`,
        borderRight: `1px solid ${colors.BLACK80}`,
        borderBottom: `1px solid ${colors.BLACK80}`,
        borderRadius: '0 0 3px 3px',
    }),
    option: (base: Record<string, any>, { isFocused }: { isFocused: boolean }) => ({
        ...base,
        color: colors.BLACK50,
        background: isFocused ? colors.BLACK96 : colors.WHITE,
        borderRadius: 0,
        '&:hover': {
            cursor: 'pointer',
            background: colors.BLACK96,
        },
    }),
});

export default styles;
