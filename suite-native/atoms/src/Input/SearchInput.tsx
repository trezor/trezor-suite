import {
    type ComponentType,
    type RefAttributes,
    forwardRef,
    useImperativeHandle,
    useRef,
} from 'react';
import { Platform, Pressable, TextInput, type TextInputProps } from 'react-native';

import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { SearchInputClearButton } from './SearchInputClearButton';
import { SearchInputMagnifyingGlass } from './SearchInputMagnifyingGlass';
import { useSearchInputCallbacks } from './useSearchInputCallbacks';

export const SEARCH_INPUT_SIZES = ['medium', 'large'] as const;
type SearchInputSize = (typeof SEARCH_INPUT_SIZES)[number];

const searchInputHeights: Record<SearchInputSize, number> = {
    medium: 40,
    large: 48,
};

type InputStyleProps = {
    isFocused: boolean;
    size: SearchInputSize;
};

const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography['body-md'],
    // `letterSpacing` from `typography['body-md']` causes layout jumps on Android; reset it
    // to the TextInput default.
    letterSpacing: 0,
    flex: 1,
    // Remove the platform default vertical padding so the input collapses to its line height
    // and stays vertically centered by the wrapper's `alignItems: 'center'` at any height.
    paddingVertical: 0,
    textAlignVertical: 'center',
    color: utils.colors.contentPrimary,
    marginLeft: utils.spacings.sp16,

    extend: {
        // on IOS, when is the default lineHeight used, it causes layout jumps between the placeholder and inputed text.
        // Probably bug in the underlying native library. Value of 20 is empiricaly found closest value to default of 24 that makes it work correctly.
        condition: Platform.OS === 'ios',
        style: {
            lineHeight: 20,
        },
    },
}));

const inputWrapperStyle = prepareNativeStyle<InputStyleProps>((utils, { isFocused, size }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: searchInputHeights[size],
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r12,
    borderColor: utils.colors.elementBorderField,
    backgroundColor: utils.colors.elementFillField,
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp16,
    extend: {
        condition: isFocused,
        style: {
            borderColor: utils.colors.elementBorderFieldFocused,
        },
    },
}));

export type SearchInputProps = {
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    isDisabled?: boolean;
    maxLength?: number;
    size?: SearchInputSize;
    value?: string;
    autoCorrect?: boolean;
    testId?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    isBottomSheetInput?: boolean;
    autoCapitalize?: TextInputProps['autoCapitalize'];
};

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
    (
        {
            onChange,
            placeholder,
            maxLength,
            autoFocus,
            onFocus,
            onBlur,
            isDisabled = false,
            size = 'medium',
            value,
            autoCorrect,
            testId,
            isBottomSheetInput = false,
            autoCapitalize,
        },
        ref,
    ) => {
        const { applyStyle, utils } = useNativeStyles();

        // Keep an internal ref so tap-to-focus and clear work even when no ref is
        // forwarded, and expose the underlying TextInput instance to forwarded refs.
        const inputRef = useRef<TextInput>(null);
        useImperativeHandle(ref, () => inputRef.current as TextInput, []);

        const {
            handleClear,
            handleInputFocus,
            handleOnChangeText,
            isFocused,
            isClearButtonVisible,
            setIsFocused,
        } = useSearchInputCallbacks(inputRef, onChange);

        // Both branches accept `TextInputProps`, but `BottomSheetTextInput` forwards its ref to
        // gesture-handler's `TextInput` — a nominally different type from react-native's. Cast to
        // a single signature so the shared `ref`/props type-check against both.
        const InputComponent = (
            isBottomSheetInput ? BottomSheetTextInput : TextInput
        ) as ComponentType<TextInputProps & RefAttributes<TextInput>>;

        return (
            <Pressable onPress={handleInputFocus}>
                <Box style={applyStyle(inputWrapperStyle, { isFocused, size })}>
                    <SearchInputMagnifyingGlass />

                    <InputComponent
                        ref={inputRef}
                        onChangeText={handleOnChangeText}
                        placeholder={placeholder}
                        accessibilityLabel={placeholder}
                        placeholderTextColor={utils.colors.contentSecondary}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={autoFocus}
                        editable={!isDisabled}
                        onFocus={() => {
                            setIsFocused(true);
                            onFocus?.();
                        }}
                        onBlur={() => {
                            setIsFocused(false);
                            onBlur?.();
                        }}
                        style={applyStyle(inputStyle)}
                        maxLength={maxLength}
                        value={value}
                        autoCorrect={autoCorrect}
                        testID={testId}
                        autoCapitalize={autoCapitalize}
                    />

                    <SearchInputClearButton
                        onPress={handleClear}
                        isVisible={isClearButtonVisible}
                    />
                </Box>
            </Pressable>
        );
    },
);
