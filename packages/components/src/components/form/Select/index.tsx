import React from 'react';
import ReactSelect, { components, Props as SelectProps } from 'react-select';
import styled from 'styled-components';
import { variables } from '../../../config';
import { useTheme } from '../../../utils';
import { scrollbarStyles } from '../../../index';
import { InputVariant, SuiteThemeColors } from '../../../support/types';

const selectStyle = (
    isSearchable: boolean,
    withDropdownIndicator = true,
    variant: InputVariant,
    hideTextCursor: boolean,
    isClean: boolean,
    theme: SuiteThemeColors
) => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        color: theme.TYPE_DARK_GREY,
        fontSize: variables.NEUE_FONT_SIZE.NORMAL,
        '&:hover': {
            cursor: hideTextCursor || !isSearchable ? 'pointer' : 'text',
        },
    }),
    control: (
        base: Record<string, any>,
        { isDisabled, isFocused }: { isDisabled: boolean; isFocused: boolean }
    ) => {
        return {
            ...base,
            minHeight: 'initial',
            display: 'flex',
            alignItems: 'center',
            fontSize: variables.FONT_SIZE.SMALL,
            height: variant === 'small' ? '36px' : '48px',
            borderRadius: '4px',
            borderWidth: '2px',
            borderColor: theme.STROKE_GREY,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:hover, &:focus': {
                cursor: 'pointer',
                borderRadius: '4px',
                borderWidth: '2px',
                borderColor: theme.STROKE_GREY,
            },
        };
    },
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base: Record<string, any>, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        display: !withDropdownIndicator || isDisabled ? 'none' : 'flex',
        alignItems: 'center',
        color: theme.TYPE_LIGHT_GREY,
        cursor: 'pointer',
        path: '',
        '&:hover': {
            color: theme.TYPE_DARK_GREY,
        },
    }),
    menu: (base: Record<string, any>) => ({
        ...base,
        margin: '5px 0',
        boxShadow: `box-shadow: 0 4px 10px 0 ${theme.BOX_SHADOW_BLACK_20}`,
        zIndex: 9,
    }),
    menuList: (base: Record<string, any>) => ({
        ...base,
        padding: 0,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        background: theme.BG_WHITE_ALT,
        borderRadius: '4px',
    }),
    option: (base: Record<string, any>, { isFocused }: { isFocused: boolean }) => ({
        ...base,
        color: theme.TYPE_DARK_GREY,
        background: isFocused ? theme.BG_WHITE_ALT_HOVER : theme.BG_WHITE_ALT,
        borderRadius: 0,
        fontSize: variables.NEUE_FONT_SIZE.NORMAL,
        '&:hover': {
            cursor: 'pointer',
        },
    }),
    input: (base: Record<string, any>) => ({
        ...base,
        fontSize: variables.NEUE_FONT_SIZE.NORMAL,
        color: hideTextCursor ? 'transparent' : theme.TYPE_DARK_GREY,
        '& input': {
            textShadow: hideTextCursor ? `0 0 0 ${theme.TYPE_DARK_GREY} !important` : 'none',
        },
    }),
});

const Wrapper = styled.div<Props>`
    width: ${props => (props.width ? `${props.width}px` : '100%')};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    .react-select__menu-list {
        ${scrollbarStyles}
    }
`;

const Label = styled.span`
    min-height: 32px;
`;

interface Option {
    value: string;
    label: string;
}

interface CommonProps extends Omit<SelectProps, 'components' | 'isSearchable'> {
    withDropdownIndicator?: boolean;
    isClean?: boolean;
    label?: React.ReactNode;
    wrapperProps?: Record<string, any>;
    variant?: InputVariant;
    noTopLabel?: boolean;
    hideTextCursor?: boolean; // this prop hides blinking text cursor
}

// Make sure isSearchable can't be defined if useKeyPressScroll===true
// If useKeyPressScroll is false or undefined, isSearchable is a boolean value
type KeyPressScrollProps =
    | { useKeyPressScroll: true; isSearchable?: never }
    | { useKeyPressScroll?: false; isSearchable?: boolean };

type Props = CommonProps & KeyPressScrollProps;

const Select = ({
    hideTextCursor = false,
    withDropdownIndicator = true,
    className,
    wrapperProps,
    isClean = false,
    label,
    width,
    variant = 'large',
    noTopLabel = false,
    useKeyPressScroll,
    isSearchable = false,
    ...props
}: Props) => {
    // TODO find proper type
    const selectRef: React.Ref<any> = React.useRef(null);
    const theme = useTheme();

    // customize control to pass data-test attribute
    const Control = (controlProps: any) => {
        return (
            <components.Control
                {...controlProps}
                innerProps={{
                    ...controlProps.innerProps,
                    'data-test': `${props['data-test']}/input`,
                }}
            />
        );
    };

    // customize options to pass data-test attribute
    const Option = (optionProps: any) => {
        return (
            <components.Option
                {...optionProps}
                innerProps={{
                    ...optionProps.innerProps,
                    'data-test': `${props['data-test']}/option/${optionProps.value}`,
                }}
            />
        );
    };

    const getFirstOptionStartingWithChar = (options: Array<Option>, char: string) => {
        // get all options that start with the character user just pressed on keyboard
        if (options.length > 0 && char) {
            const optionsStartingWithChar = options.filter(
                // use "option.label", not "option.value". Because "label" is the string user sees
                option => option.label[0].toLowerCase() === char.toLowerCase()
            );
            // return the first option
            return optionsStartingWithChar[0];
        }

        return undefined;
    };

    const scrollToOption = (option: Option) => {
        // I found a way how to scroll on and option in this tutorial: https://github.com/JedWatson/react-select/issues/3648
        selectRef.current.select.scrollToFocusedOptionOnUpdate = true;
        selectRef.current.select.setState({
            focusedValue: null,
            focusedOption: option,
        });
    };

    const onKeyDown = async (e: React.KeyboardEvent) => {
        // this function is executed when user presses keyboard
        if (useKeyPressScroll) {
            // get char value of pressed key
            const charValue = String.fromCharCode(e.keyCode);

            if (selectRef) {
                // get options object
                const { options } = selectRef.current.select.props;

                if (options && options.length > 1) {
                    /* 
                    First, check if the options are divided into sub-categories. 
                    For example <NetworkSelect> has options divided into sub-categories "mainnet" and "testnet".  
                    If such scenario I need to loop through all of the sub-categories and try to find suitable option in them.
                    */

                    let optionToFocusOn = null;

                    if (options[0].options) {
                        // If the if() statement is true, the options are nested.
                        // Loop through all of the sub-categories and check if an option starting with specified char is present
                        for (let i = 0; i < options.length; i++) {
                            optionToFocusOn = getFirstOptionStartingWithChar(
                                options[i].options,
                                charValue
                            );
                            // If some option starting with char was found, exit the loop
                            if (optionToFocusOn !== undefined) break;
                        }
                    } else {
                        // If the options aren't divided into sub-categories, you can use the default options object that is present on "selectRef"
                        optionToFocusOn = getFirstOptionStartingWithChar(options, charValue);
                    }

                    // Also get the last option, so I can scroll to it later
                    const lastOption = options[options.length - 1];

                    // Make sure all the necessary options are defined
                    if (optionToFocusOn && lastOption) {
                        /* 
                        Here we first scroll to the last option in option-list and then we scroll to the focused option.
 
                        The reason why I want to scroll to the last option first is, that I want the focused item to 
                        appear on the top of the list - I achieve that behavior by scrolling "from bottom-to-top".
                        The default scrolling behavior is "from top-to-bottom". In that case the focused option appears at the bottom
                        of options list, which is not a great UX.

                        If we don't require the focused option to be on top, just delete 'await scrollToOption(lastOption);'
                        */

                        // 1. scroll to the last option first and wait
                        await scrollToOption(lastOption);

                        // 2. scroll to the selected option
                        scrollToOption(optionToFocusOn);
                    }
                }
            }
        }
    };

    return (
        <Wrapper className={className} width={width} {...wrapperProps}>
            {!noTopLabel && <Label>{label}</Label>}
            <ReactSelect
                ref={selectRef}
                onKeyDown={onKeyDown}
                classNamePrefix="react-select"
                styles={selectStyle(
                    isSearchable,
                    withDropdownIndicator,
                    variant,
                    hideTextCursor,
                    isClean,
                    theme
                )}
                isSearchable={isSearchable}
                {...props}
                components={{ Control, Option, ...props.components }}
            />
        </Wrapper>
    );
};

export { Select, Props as SelectProps };
