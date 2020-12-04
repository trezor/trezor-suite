import React, { useRef } from 'react';
import ReactSelect, {
    components,
    Props as SelectProps,
    GroupProps,
    OptionProps,
} from 'react-select';
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
    // const selectRef: React.Ref<any> = useRef(null);
    const selectRef: React.RefObject<ReactSelect> | null | undefined = useRef(null);

    const theme = useTheme();

    // values used for custom scroll-search behavior
    const lastKeyPressTimestamp = useRef(0); // timestamp at which last keyPress event occurred
    const searchedTerm = useRef(''); // string which the user wants to find

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

    const findOption = (options: Array<Option>, query: string) => {
        // Option that will be returned
        let foundOption;

        // Save how far is the query from the beginning of option label (e.g. index of "c" in "Bitcoin" is 3)
        // This way I can give priority to options which START with the query. (Otherwise I would just return first option that CONTAINS searched term)
        let lowestIndexOfFirstOccurrence = Infinity;

        // Loop over all options
        for (let i = 0; i < options.length; i++) {
            // Find where in the option the query is located (returns -1 if not found)
            const indexOfFirstOccurrence = options[i].label
                .toLowerCase()
                .indexOf(query.toLowerCase());

            // If the query was found and it is closer to the beginning than the closes match so far, set new foundOption.
            // (This ensures that if I press "B", I return the first option STARTING with "B", not the first option CONTAINING "B")
            if (
                indexOfFirstOccurrence >= 0 &&
                indexOfFirstOccurrence < lowestIndexOfFirstOccurrence
            ) {
                lowestIndexOfFirstOccurrence = indexOfFirstOccurrence;
                foundOption = options[i];
            }
        }

        // returns "undefined" if no option was found
        return foundOption;
    };

    const scrollToOption = (option: Option) => {
        if (selectRef.current) {
            // I found a way how to scroll on and option in this tutorial: https://github.com/JedWatson/react-select/issues/3648
            selectRef.current.select.scrollToFocusedOptionOnUpdate = true;
            selectRef.current.select.setState({
                focusedValue: null,
                focusedOption: option,
            });
        }
    };

    const onKeyDown = async (e: React.KeyboardEvent) => {
        // This function is executed when user presses keyboard
        if (useKeyPressScroll) {
            // Get char value of pressed key
            const charValue = String.fromCharCode(e.keyCode);

            // Get current timestamp and check how long it is since the last keyPress event happened.
            const currentTimestamp = new Date().getTime();
            const timeSincePreviousKeyPress = currentTimestamp - lastKeyPressTimestamp.current;

            // Save current timestamp to lastKeyPressTime variable
            lastKeyPressTimestamp.current = currentTimestamp;

            // If user didn't type anything for 0.5 seconds, set searchedValue to just pressed key, otherwise add the new value to the old one
            if (timeSincePreviousKeyPress > 500) {
                searchedTerm.current = charValue;
            } else {
                searchedTerm.current += charValue;
            }

            if (selectRef.current) {
                // Get options object
                const { options } = selectRef.current.select.props;

                if (options !== undefined) {
                    if (options?[0].value === 'a') console.log('aa');
                }

                if (options && options.length > 1) {
                    /* 
                    First, check if the options are divided into sub-categories. 
                    For example <NetworkSelect> has options divided into sub-categories "mainnet" and "testnet".  
                    In such scenario I need to loop through all of the sub-categories and try to find appropriate option in them as well.
                    */

                    // array of all options in which I want to find the searched term
                    let optionsToSearchThrough: Array<Option> = [];

                    if (options[0].options) {
                        // If the if() statement is true, the options are nested.
                        // Loop through all of the sub-categories and concatenate them into one array
                        for (let i = 0; i < options.length; i++) {
                            optionsToSearchThrough = optionsToSearchThrough.concat(
                                options[i].options
                            );
                        }
                    } else {
                        // If the options aren't divided into sub-categories, you can use the default options array that is present on "selectRef"
                        optionsToSearchThrough = options;
                    }

                    // Find the option
                    const optionToFocusOn = findOption(
                        optionsToSearchThrough,
                        searchedTerm.current
                    );

                    // If no option to focus on was found, clear the searchedValue
                    if (!optionToFocusOn) searchedTerm.current = '';

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
