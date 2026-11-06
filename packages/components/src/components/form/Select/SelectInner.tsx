import { useCallback, useId, useMemo, useRef } from 'react';
import ReactSelect, {
    type ControlProps,
    type OptionProps,
    type Props as ReactSelectProps,
    type SelectInstance,
    type ValueContainerProps,
} from 'react-select';

import { SelectCacheProvider } from './SelectCacheProvider';
import { SelectOptionContext } from './SelectOption';
import {
    Control,
    DropdownIndicator,
    Group,
    GroupHeading,
    IndicatorsContainer,
    LoadingIndicator,
    Menu,
    MenuList,
    Option,
    Placeholder,
    SingleValue,
    ValueContainer,
} from './customComponents';
import { type Option as OptionType, type SelectProps } from './types';
import { createSharedMenuStyles } from './utils';
import { pickFormCellProps } from '../FormCell/FormCell';

/** The react-select part of `Select`, loaded on demand; `Select` renders the form cell around it. */
export const SelectInner = ({
    label,
    size = 'large',
    isClean,
    isSearchable = false,
    minValueWidth,
    isMenuOpen,
    onChange,
    placeholder,
    isLoading = false,
    openMenuOnFocus = true,
    menuPortalZIndex,
    menuAlign,
    components,
    'data-testid': dataTest,
    ...rest
}: SelectProps) => {
    const selectRef = useRef<SelectInstance<OptionType, boolean>>(null);
    const autoInstanceId = useId();

    const formCellProps = pickFormCellProps(rest);
    const { isDisabled, hasError } = formCellProps;

    const reactSelectProps = Object.entries(rest).reduce(
        (props, [propKey, propValue]) => {
            if (!(propKey in formCellProps)) {
                (props as Record<string, unknown>)[propKey] = propValue;
            }

            return props;
        },
        {} as Omit<ReactSelectProps<OptionType>, 'onChange' | 'menuIsOpen' | 'styles'>,
    );

    const menuStyles = useMemo(
        () => createSharedMenuStyles<OptionType>({ menuPortalZIndex, menuAlign }),
        [menuPortalZIndex, menuAlign],
    );

    const closeMenuOnScroll = (e: Event) => {
        const menuList = selectRef.current?.menuListRef;
        if (!menuList) return false;

        return !menuList.contains(e.target as Node);
    };

    const handleOnChange = useCallback<Required<ReactSelectProps<OptionType>>['onChange']>(
        value => {
            if (value) {
                onChange?.(value, selectRef.current);
            }

            return null;
        },
        [onChange],
    );

    const memoizedComponents = useMemo(
        () => ({
            Control: (controlProps: ControlProps) => (
                <Control
                    {...controlProps}
                    hasError={hasError}
                    size={size}
                    data-testid={dataTest}
                    isClean={isClean}
                    label={label}
                />
            ),
            Option: (optionProps: OptionProps) => (
                <Option {...optionProps} size={size} data-testid={dataTest} />
            ),
            Menu,
            MenuList,
            GroupHeading,
            Group,
            IndicatorsContainer,
            DropdownIndicator,
            ValueContainer: (valueContainerProps: ValueContainerProps) => (
                <ValueContainer
                    {...valueContainerProps}
                    minValueWidth={minValueWidth}
                    hasLabel={!!label && !isClean}
                    size={size}
                />
            ),
            SingleValue,
            LoadingIndicator,
            Placeholder,
            ...components,
        }),
        [dataTest, hasError, size, minValueWidth, label, isClean, components],
    );

    return (
        <SelectCacheProvider>
            <SelectOptionContext.Provider value={Option}>
                <ReactSelect
                    ref={selectRef}
                    openMenuOnFocus={openMenuOnFocus}
                    closeMenuOnScroll={closeMenuOnScroll}
                    menuPosition="fixed"
                    onChange={handleOnChange}
                    isSearchable={isSearchable}
                    menuIsOpen={isMenuOpen}
                    isDisabled={isDisabled ?? false}
                    isLoading={isLoading}
                    menuPlacement="auto"
                    placeholder={placeholder ?? ''}
                    unstyled
                    styles={menuStyles}
                    components={memoizedComponents}
                    instanceId={autoInstanceId}
                    {...reactSelectProps}
                />
            </SelectOptionContext.Provider>
        </SelectCacheProvider>
    );
};
