import { useRef, useCallback, RefObject, KeyboardEvent } from 'react';
import { GroupBase, Options, OptionsOrGroups, SelectInstance } from 'react-select';
import type { Option } from './Select';

/** Custom Type Guards to check if options are grouped or not */
const isOptionGrouped = (x: OptionsOrGroups<Option, GroupBase<Option>>): x is GroupBase<Option>[] =>
    (x as readonly GroupBase<Option>[])[0]?.options !== undefined;

export const useOnKeyDown = (
    selectRef: RefObject<SelectInstance<Option, boolean>>,
    useKeyPressScroll?: boolean,
) => {
    const lastKeyPressTimestamp = useRef(0);
    const searchedTerm = useRef('');

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

    const scrollToOption = useCallback(
        (option: Option) => {
            if (selectRef.current) {
                // As per https://github.com/JedWatson/react-select/issues/3648
                selectRef.current.scrollToFocusedOptionOnUpdate = true;
                selectRef.current.setState({
                    focusedValue: null,
                    focusedOption: option,
                });
            }
        },
        [selectRef],
    );

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
        [findOption, scrollToOption, useKeyPressScroll, selectRef],
    );

    return onKeyDown;
};
