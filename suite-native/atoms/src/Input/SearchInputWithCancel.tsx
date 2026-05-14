import React, { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Translation, useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TextButton } from '../Button/TextButton';
import { HStack } from '../Stack';

type ClearAndBlur = {
    clear?: () => void;
    blur?: () => void;
};

export type SearchComponentProps = {
    placeholder: string;
    onChange: (value: string) => void;
    value: string;
    onFocus?: () => void;
    onBlur?: () => void;
    autoCorrect?: boolean;
};

export type SearchInputWithCancelProps<R extends ClearAndBlur | null> = {
    SearchComponent: SearchComponentWithRef<R>;
    searchRef: React.RefObject<R | null>;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
};

export type SearchComponentWithRef<R extends ClearAndBlur | null> = React.ForwardRefExoticComponent<
    SearchComponentProps & React.RefAttributes<R>
>;

const inputWrapperStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const buttonWrapperStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp24,
}));

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    paddingLeft: spacings.sp8,
}));

export function SearchInputWithCancel<R extends ClearAndBlur | null>({
    SearchComponent,
    searchRef,
    onChange,
    placeholder,
    onFocus,
    onBlur,
    ...props
}: SearchInputWithCancelProps<R>) {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const [isInputActive, setIsInputActive] = useState(false);
    const debounce = useDebounce();

    useEffect(() => () => onChange(''), [onChange]);

    const handleCancel = () => {
        onChange('');
        searchRef?.current?.clear?.();
        searchRef?.current?.blur?.();
    };

    const handleOnChange = (value: string) => {
        debounce(() => {
            onChange(value);
        });
    };

    return (
        <HStack alignItems="center" spacing={0}>
            <Animated.View layout={LinearTransition} style={applyStyle(inputWrapperStyle)}>
                <SearchComponent
                    {...(searchRef ? { ref: searchRef as React.Ref<any> } : {})}
                    placeholder={placeholder ?? translate('moduleTrading.defaultSearchLabel')}
                    onFocus={() => {
                        setIsInputActive(true);
                        onFocus?.();
                    }}
                    onBlur={() => {
                        setIsInputActive(false);
                        onBlur?.();
                    }}
                    onChange={handleOnChange}
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
}
