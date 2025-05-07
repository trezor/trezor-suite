import { useEffect, useRef, useState } from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import {
    BottomSheetSearchInput,
    BottomSheetSearchInputProps,
    BottomSheetSearchInputRef,
    HStack,
    TextButton,
} from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type SearchInputWithCancelProps = Omit<BottomSheetSearchInputProps, 'elevation'>;

const noOp = () => {};

const inputWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const buttonWrapperStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp24,
}));

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    paddingLeft: spacings.sp8,
}));

export const SearchInputWithCancel = ({
    onFocus = noOp,
    onBlur = noOp,
    onChange,
    placeholder,
    ...props
}: SearchInputWithCancelProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const [isInputActive, setIsInputActive] = useState(false);
    const inputRef = useRef<BottomSheetSearchInputRef>(null);
    const debounce = useDebounce();

    useEffect(() => () => onChange(''), [onChange]);

    const handleCancel = () => {
        onChange('');
        inputRef.current?.clear();
        inputRef.current?.blur();
    };

    const handleOnChange = (value: string) => {
        debounce(() => {
            onChange(value);
        });
    };

    return (
        <HStack alignItems="center" spacing={0}>
            <Animated.View layout={LinearTransition} style={applyStyle(inputWrapperStyle)}>
                <BottomSheetSearchInput
                    ref={inputRef}
                    placeholder={placeholder ?? translate('moduleTrading.defaultSearchLabel')}
                    onFocus={() => {
                        setIsInputActive(true);
                        onFocus();
                    }}
                    onBlur={() => {
                        setIsInputActive(false);
                        onBlur();
                    }}
                    onChange={handleOnChange}
                    autoCorrect={false}
                    {...props}
                />
            </Animated.View>
            <Animated.View layout={LinearTransition} style={applyStyle(buttonWrapperStyle)}>
                {isInputActive && (
                    <Animated.View
                        layout={LinearTransition}
                        entering={FadeIn.delay(100)}
                        exiting={FadeOut}
                        style={applyStyle(buttonStyle)}
                    >
                        <TextButton onPress={handleCancel}>
                            <Translation id="generic.buttons.cancel" />
                        </TextButton>
                    </Animated.View>
                )}
            </Animated.View>
        </HStack>
    );
};
