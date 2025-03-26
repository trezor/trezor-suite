import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { HStack, SearchInput, SearchInputProps, TextButton } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type SearchInputWithCancelProps = Omit<SearchInputProps, 'placeholder' | 'elevation'>;

const noOp = () => {};

const inputWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const buttonWrapperStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp24,
}));

export const SearchInputWithCancel = ({
    onFocus = noOp,
    onBlur = noOp,
    onChange,
    ...props
}: SearchInputWithCancelProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const [isInputActive, setIsInputActive] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => () => onChange(''), [onChange]);

    const handleCancel = () => {
        onChange('');
        inputRef.current?.clear();
        inputRef.current?.blur();
    };

    return (
        <HStack alignItems="center">
            <Animated.View layout={LinearTransition} style={applyStyle(inputWrapperStyle)}>
                <SearchInput
                    ref={inputRef}
                    placeholder={translate('moduleTrading.defaultSearchLabel')}
                    onFocus={() => {
                        setIsInputActive(true);
                        onFocus();
                    }}
                    onBlur={() => {
                        setIsInputActive(false);
                        onBlur();
                    }}
                    onChange={onChange}
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
