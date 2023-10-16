import { useCallback, useEffect, useRef, useState, ReactNode, KeyboardEvent } from 'react';
import ReactSelect, {
    components as ReactSelectComponents,
    Props as ReactSelectProps,
    Options,
    GroupBase,
    OptionsOrGroups,
    StylesConfig,
    ControlProps,
    OptionProps,
    SelectInstance,
    GroupHeadingProps,
} from 'react-select';
import styled, { css, DefaultTheme, useTheme } from 'styled-components';
import { darken } from 'polished';
import { borders } from '@trezor/theme';

import { FONT_WEIGHT, FONT_SIZE, Z_INDEX } from '../../../config/variables';
import { animations } from '../../../config';

import {
    Label,
    LabelLeft,
    INPUT_HEIGHTS,
    INPUT_BORDER_WIDTH,
    getInputStateTextColor,
    getInputStateBorderColor,
} from '../InputStyles';
import { BottomText } from '../BottomText';
import { MODAL_CONTENT_ID } from '../../modals/Modal/Modal';
import { InputState, InputSize } from '../inputTypes';

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
        zIndex: Z_INDEX.BASE,
    }),
    menuPortal: base => ({
        ...base,
        zIndex: Z_INDEX.MODAL /* Necessary to be visible inside a Modal */,
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

// Prevent closing the menu when scrolling through options.
const closeMenuOnScroll = (e: Event) =>
    !(e.target as Element)?.className?.startsWith(reactSelectClassNamePrefix);

type Option = any;

/** Custom Type Guards to check if options are grouped or not */
const isOptionGrouped = (x: OptionsOrGroups<Option, GroupBase<Option>>): x is GroupBase<Option>[] =>
    (x as readonly GroupBase<Option>[])[0]?.options !== undefined;

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
    const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);
    const selectRef = useRef<SelectInstance<Option, boolean>>(null);
    const lastKeyPressTimestamp = useRef(0);
    const searchedTerm = useRef('');
    const theme = useTheme();

    const findOption = useCallback((options: Options<Option>, query: string) => {
        let foundOption;
        let lowestIndexOfFirstOccurrence = Infinity;

        for (let i = 0; i < options.length; i++) {
            const indexOfFirstOccurrence = (options[i].label || '')
                .toLowerCase()
                .indexOf(query.toLowerCase());

            if (
                indexOfFirstOccurrence >= 0 &&
                indexOfFirstOccurrence < lowestIndexOfFirstOccurrence
            ) {
                lowestIndexOfFirstOccurrence = indexOfFirstOccurrence;
                foundOption = options[i];
            }
        }

        return foundOption;
    }, []);

    const scrollToOption = useCallback((option: Option) => {
        if (selectRef.current) {
            // As per https://github.com/JedWatson/react-select/issues/3648
            selectRef.current.scrollToFocusedOptionOnUpdate = true;
            selectRef.current.setState({
                focusedValue: null,
                focusedOption: option,
            });
        }
    }, []);

    const onKeyDown = useCallback(
        async (event: KeyboardEvent) => {
            if (!useKeyPressScroll || !selectRef.current) {
                return;
            }

            const charValue = event.key;

            const currentTimestamp = new Date().getTime();
            const timeSincePreviousKeyPress = currentTimestamp - lastKeyPressTimestamp.current;

            lastKeyPressTimestamp.current = currentTimestamp;

            if (timeSincePreviousKeyPress > 800) {
                searchedTerm.current = charValue;
            } else {
                searchedTerm.current += charValue;
            }

            const { options } = selectRef.current.props;

            if (options && options.length > 1) {
                let optionsToSearchThrough: Options<Option> = [];

                if (isOptionGrouped(options)) {
                    options.forEach(o => {
                        optionsToSearchThrough = optionsToSearchThrough.concat(o.options);
                    });
                } else {
                    optionsToSearchThrough = options as Options<Option>;
                }

                const optionToFocusOn = findOption(optionsToSearchThrough, searchedTerm.current);

                const lastOption = optionsToSearchThrough[optionsToSearchThrough.length - 1];

                if (optionToFocusOn && lastOption) {
                    /*
                        The reason why I want to scroll to the last option first is, that I want the focused item to
                        appear on the top of the list - I achieve that behavior by scrolling "from bottom-to-top".
                        The default scrolling behavior is "from top-to-bottom". In that case the focused option appears at the bottom
                        of options list, which is not a great UX.
                    */

                    await scrollToOption(lastOption);

                    scrollToOption(optionToFocusOn);
                }
            }
        },
        [findOption, scrollToOption, useKeyPressScroll],
    );

    // Check if the select is within a modal. If so, render it inside a portal so that it can overflow the modal.
    // The inputRef is deeply nested so we iterate with while loop until wee reach the parentElement or max depth.
    // The depth has a limit so that it does not iterate over the entire DOM.
    // The depth limit has a buffer of 2 iterations in case the select is wrapped. (Minimum depth is 4.)
    useEffect(() => {
        let parent = selectRef.current?.inputRef?.parentElement;
        let count = 0;
        while (parent) {
            if (parent.id === MODAL_CONTENT_ID) {
                setMenuPortalTarget(document.body);
                break;
            }
            if (count > 5) {
                break;
            }
            parent = parent.parentElement;
            count++;
        }
    }, []);

    const Control = useCallback(
        (controlProps: ControlProps<Option>) => (
            <ReactSelectComponents.Control
                {...controlProps}
                innerProps={
                    dataTest
                        ? ({
                              ...controlProps.innerProps,
                              'data-test': `${dataTest}/input`,
                          } as ControlProps<Option>['innerProps'])
                        : controlProps.innerProps
                }
            />
        ),
        [dataTest],
    );

    const Option = useCallback(
        (optionProps: OptionProps<Option, boolean>) => (
            <ReactSelectComponents.Option
                {...optionProps}
                innerProps={
                    {
                        ...optionProps.innerProps,
                        'data-test': `${dataTest}/option/${
                            typeof optionProps.data.value === 'string'
                                ? optionProps.data.value
                                : optionProps.label
                        }`,
                    } as OptionProps<Option, boolean>['innerProps']
                }
            />
        ),
        [dataTest],
    );

    const GroupHeading = useCallback(
        (groupHeadingProps: GroupHeadingProps<Option>) =>
            groupHeadingProps?.data?.label ? (
                <ReactSelectComponents.GroupHeading {...groupHeadingProps} />
            ) : null,
        [],
    );

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
                components={{ Control, Option, GroupHeading, ...components }}
            />

            {!noError && <BottomText inputState={inputState}>{bottomText}</BottomText>}
        </Wrapper>
    );
};
