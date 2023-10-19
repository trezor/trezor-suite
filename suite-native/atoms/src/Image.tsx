import { Image as RNImage, ImageProps as RNImageProps } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ImageProps = {
    width?: number;
    height?: number;
    style?: NativeStyleObject;
} & Omit<RNImageProps, 'style'>;

const imageStyle = prepareNativeStyle<{ width?: number; height?: number }>(
    (_, { width, height }) => ({
        width,
        height,
    }),
);

export const Image = ({ width, height, source, style, ...otherProps }: ImageProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <RNImage
            {...otherProps}
            source={source}
            style={[applyStyle(imageStyle, { width, height }), style]}
        />
    );
};
