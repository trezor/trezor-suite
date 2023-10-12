import { useCallback, useRef, ReactNode } from 'react';
import ReactSelect, { Props as ReactSelectProps, StylesConfig, SelectInstance } from 'react-select';
import styled, { css, DefaultTheme, useTheme } from 'styled-components';
import { darken } from 'polished';
import { borders, zIndices } from '@trezor/theme';

import { FONT_WEIGHT, FONT_SIZE } from '../../../config/variables';
import { animations } from '../../../config';

import {
    LabelLeft,
    INPUT_HEIGHTS,
    INPUT_BORDER_WIDTH,
    getInputStateTextColor,
    getInputStateBorderColor,
} from '../InputStyles';
import { BottomText } from '../BottomText';
import { InputState, InputSize } from '../inputTypes';
import { Control, GroupHeading, Option } from './customComponents';
import { useOnKeyDown } from './useOnKeyDown';
import { useDetectPortalTarget } from './useDetectPortalTarget';

const reactSelectClassNamePrefix = 'react-select';

const selectStyle = (
    isSearchable: boolean,
    withDropdownIndicator = true,
    variant: InputSize,
    hideTextCursor: boolean,
    isClean: boolean,
    minWidth: string,
    theme: DefaultTheme,
    inputState?: InputState,
): StylesConfig<Option, boolean> => ({
    singleValue: base => ({
        ...base,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 'initial',
        margin: 0,
        padding: '0 8px',
        color: isClean ? theme.TYPE_LIGHT_GREY : theme.TYPE_DARK_GREY,
        fontSize: FONT_SIZE.SMALL,
        fontWeight: FONT_WEIGHT.MEDIUM,
        borderStyle: 'none',
        justifyContent: isClean ? 'flex-end' : 'flex-start',
        position: 'static',
        transform: 'none',
        '&:hover': {
            cursor: hideTextCursor || !isSearchable ? 'pointer' : 'text',
        },
    }),
    control: (base, { isDisabled, menuIsOpen }) => {
        const borderColorBase = menuIsOpen ? theme.TYPE_LIGHT_GREY : theme.STROKE_GREY;
        const borderColor = inputState
            ? getInputStateBorderColor(inputState, theme)
            : borderColorBase;

        return {
            ...base,
            display: 'flex',
            alignItems: 'center',
            fontSize: FONT_SIZE.SMALL,
            height: isClean ? 22 : INPUT_HEIGHTS[variant],
            borderRadius: borders.radii.sm,
            borderWidth: INPUT_BORDER_WIDTH,
            borderColor,
            borderStyle: isClean ? 'none' : 'solid',
            backgroundColor: isDisabled && !isClean ? theme.BG_GREY : 'transparent',
            boxShadow: 'none',
            flexWrap: 'nowrap',
            cursor: 'pointer',
            '&:hover': {
                borderColor: darken(
                    theme.HOVER_DARKEN_FILTER,
                    inputState ? getInputStateTextColor(inputState, theme) : borderColorBase,
                ),
                [`.${reactSelectClassNamePrefix}__dropdown-indicator`]: {
                    color: darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY),
                },
            },
            '&:focus-within': {
                borderColor: inputState
                    ? darken(theme.HOVER_DARKEN_FILTER, getInputStateTextColor(inputState, theme))
                    : theme.TYPE_LIGHT_GREY,
                [`.${reactSelectClassNamePrefix}__dropdown-indicator`]: {
                    color: theme.TYPE_LIGHT_GREY,
                    transform: menuIsOpen ? 'rotate(180deg)' : 'none',
                },
            },
        };
    },
    valueContainer: base => ({
        ...base,
        border: 0,
        padding: isClean ? '0 3px 0 0' : '2px 8px',
        fontWeight: isClean ? FONT_WEIGHT.MEDIUM : FONT_WEIGHT.REGULAR,
        minWidth,
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: isClean ? 'flex-end' : 'flex-start',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base, { isDisabled }) => ({
        ...base,
        display: !withDropdownIndicator || isDisabled ? 'none' : 'flex',
        alignItems: 'center',
        color: isClean ? theme.TYPE_LIGHTER_GREY : theme.STROKE_GREY,
        cursor: 'pointer',
        path: '',
        padding: isClean ? 0 : '10px 16px',
        transition: `transform 0.2s cubic-bezier(0.68, -0.02, 0.21, 1.1)`,
    }),
    menu: base => ({
        ...base,
        width: 'max-content',
        minWidth: '100%',
        background: theme.BG_WHITE_ALT,
        margin: '5px 0',
        borderRadius: '4px',
        zIndex: zIndices.base,
    }),
    menuPortal: base => ({
        ...base,
        zIndex: zIndices.modal /* Necessary to be visible inside a Modal */,
    }),
    menuList: base => ({
        ...base,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        background: theme.BG_WHITE_ALT,
        borderRadius: 8,
        padding: 8,
    }),
    groupHeading: base => ({
        ...base,
        fontSize: FONT_SIZE.TINY,
        textTransform: 'initial',
        margin: 0,
        padding: 8,
    }),
    group: base => ({
        ...base,
        padding: 0,
        '& + &': {
            paddingTop: 4,
            marginTop: 4,
        },
    }),
    option: (base, { isFocused }) => ({
        ...base,
        color: theme.TYPE_DARK_GREY,
        background: isFocused ? theme.BG_WHITE_ALT_HOVER : theme.BG_WHITE_ALT,
        borderRadius: 5,
        padding: 8,
        fontSize: FONT_SIZE.SMALL,
        fontWeight: FONT_WEIGHT.MEDIUM,
        '&:hover': {
            cursor: 'pointer',
        },
        '&:active': {
            background: theme.BG_WHITE_ALT_HOVER,
        },
    }),
    input: base => ({
        ...base,
        width: hideTextCursor ? 2 : 'auto',
        margin: hideTextCursor ? 0 : 2,
        fontSize: FONT_SIZE.SMALL,
        fontWeight: FONT_WEIGHT.MEDIUM,
        padding: '2px 6px',
        color: hideTextCursor ? 'transparent' : theme.TYPE_DARK_GREY,
        '& input': {
            textShadow: hideTextCursor ? `0 0 0 ${theme.TYPE_DARK_GREY} !important` : 'none',
        },
    }),
    placeholder: base => ({
        ...base,
        fontWeight: FONT_WEIGHT.MEDIUM,
        fontSize: FONT_SIZE.SMALL,
        padding: '0 6px',
        position: 'absolute',
    }),
});

const Wrapper = styled.div<Pick<SelectProps, 'isClean'>>`
    width: 100%;

    .${reactSelectClassNamePrefix}__menu {
        animation: ${animations.DROPDOWN_MENU} 0.15s ease-in-out;
    }

    ${({ isClean }) =>
        !isClean &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        `}
`;

const Label = styled.div`
    display: flex;
    justify-content: end;
    align-items: flex-end;
    min-height: 30px;
    padding-bottom: 6px;
`;

// Prevent closing the menu when scrolling through options.
const closeMenuOnScroll = (e: Event) =>
    !(e.target as Element)?.className?.startsWith(reactSelectClassNamePrefix);

export type Option = any;

interface CommonProps extends Omit<ReactSelectProps<Option>, 'onChange'> {
    withDropdownIndicator?: boolean;
    isClean?: boolean;
    label?: ReactNode;
    wrapperProps?: Record<string, any>;
    size?: InputSize;
    noError?: boolean;
    bottomText?: ReactNode;
    hideTextCursor?: boolean; // this prop hides blinking text cursor
    minWidth?: string;
    inputState?: InputState;
    onChange?: (value: Option, ref?: SelectInstance<Option, boolean> | null) => void;
    'data-test'?: string;
}

// Make sure isSearchable can't be defined if useKeyPressScroll===true
// If useKeyPressScroll is false or undefined, isSearchable is a boolean value
type KeyPressScrollProps =
    | { useKeyPressScroll: true; isSearchable?: never }
    | { useKeyPressScroll?: false; isSearchable?: boolean };

export type SelectProps = CommonProps & KeyPressScrollProps;

export const Select = ({
    hideTextCursor = false,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    isClean = false,
    label,
    size = 'large',
    noError = true,
    bottomText,
    useKeyPressScroll,
    isSearchable = false,
    minWidth = 'initial',
    menuIsOpen,
    inputState,
    components,
    onChange,
    'data-test': dataTest,
    ...props
}: SelectProps) => {
    const selectRef = useRef<SelectInstance<Option, boolean>>(null);

    const theme = useTheme();
    const onKeyDown = useOnKeyDown(selectRef, useKeyPressScroll);
    const menuPortalTarget = useDetectPortalTarget(selectRef);

    const handleOnChange = useCallback<Required<ReactSelectProps>['onChange']>(
        (value, { action }) => {
            if (value) {
                onChange?.(value, selectRef.current);

                if (!menuIsOpen && action === 'select-option') {
                    selectRef.current?.blur();
                }
            }
            return null;
        },
        [onChange, menuIsOpen],
    );

    return (
        <Wrapper className={className} isClean={isClean} {...wrapperProps}>
            {label && (
                <Label>
                    <LabelLeft>{label}</LabelLeft>
                </Label>
            )}

            <ReactSelect
                ref={selectRef}
                onKeyDown={onKeyDown}
                classNamePrefix={reactSelectClassNamePrefix}
                openMenuOnFocus
                closeMenuOnScroll={closeMenuOnScroll}
                menuPosition="fixed" // Required for closeMenuOnScroll to work properly when near page bottom
                menuPortalTarget={menuPortalTarget}
                styles={selectStyle(
                    isSearchable,
                    withDropdownIndicator,
                    size,
                    hideTextCursor,
                    isClean,
                    minWidth,
                    theme,
                    inputState,
                )}
                onChange={handleOnChange}
                isSearchable={isSearchable}
                menuIsOpen={menuIsOpen}
                {...props}
                components={{
                    Control: controlProps => <Control {...controlProps} dataTest={dataTest} />,
                    Option: optionProps => <Option {...optionProps} dataTest={dataTest} />,
                    GroupHeading,
                    ...components,
                }}
            />

            {!noError && <BottomText inputState={inputState}>{bottomText}</BottomText>}
        </Wrapper>
    );
};
