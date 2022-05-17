import React from 'react';
import { Text as RNText } from 'react-native';
import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Button } from './Button';
import { Box } from './Box';

type HintType = 'hint' | 'error';

type HintProps = {
    type: HintType;
    message: string;
    children?: React.ReactNode;
};

const hintTypeStyle = prepareNativeStyle<{ type: HintType }>((utils, { type }) => {
    const hintTypeStyles: Record<HintType, NativeStyleObject> = {
        hint: {
            color: utils.colors.gray600,
        },
        error: {
            color: utils.colors.red,
        },
    };

    return {
        ...utils.typography.hint,
        ...hintTypeStyles[type],
        marginLeft: 6,
    };
});

export const Hint = ({ type, message, children }: HintProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <>
            {children}
            <Box flexDirection="row" alignItems="center">
                <Button onPress={() => {}} size="md" colorScheme="primary">
                    TODO icon by type
                </Button>
                <RNText style={[applyStyle(hintTypeStyle, { type })]}>{message}</RNText>
            </Box>
        </>
    );
};
