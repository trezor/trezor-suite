import React, { useRef } from 'react';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TextInput, Pressable, View } from 'react-native';
import { Box } from './Box';
import { Icon } from './Icon/Icon';

const MAX_LENGTH = 255;

type InputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    isClearable?: boolean;
    isDisabled?: boolean;
    // leftIcon?: IconType; Ready when Dan merges icon PR
};

const inputStyle = prepareNativeStyle(utils => ({
    flex: 1,
    fontSize: 16,
    color: utils.colors.gray700,
    height: '100%',
    marginLeft: utils.spacings.md,
}));

const clearIconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray500,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: utils.borders.radii.round,
    // marginRight: utils.spacings.md,
}));

const inputWrapperStyle = prepareNativeStyle(utils => {
    return {
        height: 58,
        borderWidth: 1,
        borderColor: utils.colors.gray200,
        backgroundColor: utils.colors.gray100,
        borderRadius: utils.borders.radii.basic,
        padding: 14,
        // TODO styles for focused input
        // extend: [
        //     {
        //         condition: !!isFocused,
        //         style: {
        //             borderColor: utils.colors.red,
        //         },
        //     },
        // ],
    };
});

export const Input = ({
    value,
    onChange,
    placeholder,
    isClearable = false,
    isDisabled = false,
}: InputProps) => {
    const { applyStyle } = useNativeStyles();

    const inputRef = useRef<TextInput | null>(null);

    const handleClear = () => {
        onChange('');
    };

    return (
        <Box
            style={applyStyle(inputWrapperStyle)}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
        >
            <View>
                <Icon type="search" color={'gray600'} />
            </View>
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                maxLength={MAX_LENGTH}
                style={[
                    applyStyle(inputStyle, {
                        isFocused: true,
                    }),
                ]}
                editable={!isDisabled}
            />
            {isClearable && (
                <Pressable onPress={handleClear} style={applyStyle(clearIconStyle)}>
                    <Icon type="close" size="small" color="white" />
                </Pressable>
            )}
        </Box>
    );
};
