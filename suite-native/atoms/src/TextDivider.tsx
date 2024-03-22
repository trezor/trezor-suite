import { View } from 'react-native';
import { ReactNode } from 'react';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, BoxProps } from './Box';
import { Divider } from './Divider';
import { Text } from './Text';

interface TextDividerProps extends BoxProps {
    title: ReactNode;
    style?: NativeStyleObject;
}

const textDividerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: utils.spacings.medium,
}));

export const TextDivider = ({ title, style }: TextDividerProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(textDividerStyle), style]}>
            <Divider />
            <Box marginHorizontal="extraLarge">
                <Text variant="body" color="textSubdued">
                    {title}
                </Text>
            </Box>
            <Divider />
        </View>
    );
};
