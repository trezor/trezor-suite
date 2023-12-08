import { Image as ExImage, ImageProps as ExImageProps } from 'expo-image';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ImageProps = {
    width?: number;
    height?: number;
    style?: NativeStyleObject;
} & Omit<ExImageProps, 'style'>;

const imageStyle = prepareNativeStyle<{ width?: number; height?: number }>(
    (_, { width, height }) => ({
        width,
        height,
    }),
);

export const Image = ({ width, height, source, style, ...otherProps }: ImageProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <ExImage
            {...otherProps}
            source={source}
            style={[applyStyle(imageStyle, { width, height }), style]}
        />
    );
};
