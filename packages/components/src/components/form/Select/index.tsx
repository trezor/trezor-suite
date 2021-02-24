import React, { useRef } from 'react';
import ReactSelect, {
    components,
    Props as SelectProps,
    OptionsType,
    GroupedOptionsType,
} from 'react-select';
import styled, { css } from 'styled-components';
import { variables } from '../../../config';
import { useTheme } from '../../../utils';
import { scrollbarStyles } from '../../Scrollbar';
import { InputVariant, SuiteThemeColors } from '../../../support/types';

const selectStyle = (
    isSearchable: boolean,
    withDropdownIndicator = true,
    variant: InputVariant,
    hideTextCursor: boolean,
    isClean: boolean,
    minWidth: string,
    theme: SuiteThemeColors
) => ({
    singleValue: (base: Record<string, any>) => ({
        ...base,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        color: isClean ? theme.TYPE_LIGHT_GREY : theme.TYPE_DARK_GREY,
        fontSize: variables.NEUE_FONT_SIZE.NORMAL,
        borderStyle: 'none',
        justifyContent: isClean ? 'flex-end' : 'flex-start',
        '&:hover': {
            cursor: hideTextCursor || !isSearchable ? 'pointer' : 'text',
        },
    }),
    control: (
        base: Record<string, any>,
        { isDisabled, isFocused }: { isDisabled: boolean; isFocused: boolean }
    ) => {
        let height = variant === 'small' ? '36px' : '48px';
        if (isClean) height = '22px';
        return {
            ...base,
            display: 'flex',
            alignItems: 'center',
            fontSize: variables.FONT_SIZE.SMALL,
            height,
            borderRadius: '4px',
            borderWidth: '2px',
            borderColor: theme.STROKE_GREY,
            borderStyle: isClean ? 'none' : 'solid',
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
    valueContainer: (base: Record<string, any>) =>
        ({
            ...base,
            border: 0,
            padding: isClean ? '0 3px 0 0' : '2px 8px',
            fontWeight: isClean ? variables.FONT_WEIGHT.MEDIUM : variables.FONT_WEIGHT.REGULAR,
            minWidth,
            display: 'flex',
            flexWrap: 'nowrap',
            justifyContent: isClean ? 'flex-end' : 'flex-start',
        } as const),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base: Record<string, any>, { isDisabled }: { isDisabled: boolean }) => ({
        ...base,
        display: !withDropdownIndicator || isDisabled ? 'none' : 'flex',
        alignItems: 'center',
        color: isClean ? theme.TYPE_LIGHTER_GREY : theme.TYPE_LIGHT_GREY,
        cursor: 'pointer',
        path: '',
        padding: isClean ? 0 : '8px',
        '&:hover': {
            color: isClean ? theme.TYPE_LIGHT_GREY : theme.TYPE_DARK_GREY,
        },
    }),
    menu: (base: Record<string, any>) => ({
        ...base,
        background: theme.BG_WHITE_ALT,
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
            background: theme.BG_WHITE_ALT_HOVER,
        },
        '&:active': {
            background: theme.BG_WHITE_ALT_HOVER,
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

    ${props =>
        !props.isClean &&
        css`
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        `}

    .react-select__single-value {
        position: static;
        transform: none;
    }
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

/** Custom Type Guards to check if options are grouped or not */
const isOptionGrouped = (
    x: OptionsType<Option> | GroupedOptionsType<Option>
): x is GroupedOptionsType<Option> => {
    return (x as GroupedOptionsType<Option>)[0]?.options !== undefined;
};

interface CommonProps extends Omit<SelectProps, 'components' | 'isSearchable'> {
    withDropdownIndicator?: boolean;
    isClean?: boolean;
    label?: React.ReactNode;
    wrapperProps?: Record<string, any>;
    variant?: InputVariant;
    noTopLabel?: boolean;
    hideTextCursor?: boolean; // this prop hides blinking text cursor
    minWidth?: string;
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
    minWidth = 'initial',
    ...props
}: Props) => {
    const selectRef: React.RefObject<ReactSelect<Option>> | null | undefined = useRef(null);

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

    const findOption = (options: OptionsType<Option>, query: string) => {
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

            // If user didn't type anything for 0.8 seconds, set searchedValue to just pressed key, otherwise add the new value to the old one
            if (timeSincePreviousKeyPress > 800) {
                searchedTerm.current = charValue;
            } else {
                searchedTerm.current += charValue;
            }

            if (selectRef.current) {
                // Get options object
                const { options } = selectRef.current.select.props;

                if (options && options.length > 1) {
                    /* 
                    First, check if the options are divided into sub-categories. 
                    For example <NetworkSelect> has options divided into sub-categories "mainnet" and "testnet".  
                    In such scenario I need to loop through all of the sub-categories and try to find appropriate option in them as well.
                    */

                    // array of all options in which I want to find the searched term
                    let optionsToSearchThrough: OptionsType<Option> = [];

                    if (isOptionGrouped(options)) {
                        // Options are nested. Loop through all of the sub-categories and concatenate them into one array
                        // Condition is based on the format of the first item,
                        // I am not sure if it is possible to have both grouped and ungrouped items at the same time
                        // if so than this is not going to work very well, but it can be fixed easily (just check each item if it is a group or not, and adjust the typeguard to type the item instead of whole options array)
                        options.forEach(o => {
                            optionsToSearchThrough = optionsToSearchThrough.concat(o.options);
                        });
                    } else {
                        // If the options aren't divided into sub-categories, you can use the default options array that is present on "selectRef"
                        optionsToSearchThrough = options;
                    }

                    // Find the option
                    const optionToFocusOn = findOption(
                        optionsToSearchThrough,
                        searchedTerm.current
                    );

                    // Also get the last option, so I can scroll to it later
                    const lastOption = optionsToSearchThrough[optionsToSearchThrough.length - 1];

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
        <Wrapper className={className} width={width} isClean={isClean} {...wrapperProps}>
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
                    minWidth,
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
