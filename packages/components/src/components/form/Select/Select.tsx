import { ReactNode, useCallback, useId, useMemo, useRef } from 'react';
import ReactSelect, {
    ControlProps,
    OptionProps,
    Props as ReactSelectProps,
    SelectInstance,
    ValueContainerProps,
} from 'react-select';

import {
    FormCell,
    FormCellProps,
    allowedFormCellFrameProps,
    pickFormCellProps,
} from '../FormCell/FormCell';
import { InputSize } from '../types';
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
import { Option as OptionType } from './types';
import { createSharedMenuStyles } from './utils';
import { FrameProps } from '../../../utils/frameProps';

export const allowedSelectFrameProps = allowedFormCellFrameProps;
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSelectFrameProps)[number]>;

export type { Option } from './types';

export type SelectProps = AllowedFrameProps &
    Omit<FormCellProps, 'children'> &
    Omit<ReactSelectProps<OptionType>, 'onChange' | 'menuIsOpen' | 'styles'> & {
        label?: ReactNode;
        size?: InputSize;
        minValueWidth?: number;
        isClean?: boolean;
        isMenuOpen?: boolean;
        isLoading?: boolean;
        onChange?: (value: OptionType, ref?: SelectInstance<OptionType, boolean> | null) => void;
        'data-testid'?: string;
        openMenuOnFocus?: boolean;
        /** When using menuPortalTarget (e.g. in modals), set this so the menu appears above the modal */
        menuPortalZIndex?: number;
    };

export const Select = ({
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
        () => createSharedMenuStyles<OptionType>(menuPortalZIndex),
        [menuPortalZIndex],
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
        <FormCell {...formCellProps}>
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
        </FormCell>
    );
};
