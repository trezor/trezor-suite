import { useState } from 'react';

import { Image, RoundedIcon } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { IMAGE_PROXY_API_AUTH_BEARER, IMAGE_PROXY_API_URL } from '@trezor/urls';

const sizeMapping = {
    medium: 48,
    large: 60,
};
const fallbackIconSizeMapping = {
    medium: 'mediumLarge' as const,
    large: 'extraLarge' as const,
};

const imageStyle = prepareNativeStyle<{ size: number }>((_, { size }) => ({
    borderRadius: size / 2,
}));

export const ConnectAppIcon = ({
    src,
    type,
    size = 'medium',
}: {
    src?: string;
    type?: 'walletConnect' | 'trezorConnect';
    size?: 'medium' | 'large';
}) => {
    const { applyStyle } = useNativeStyles();

    const [isFallback, setIsFallback] = useState(false);

    if (isFallback || !src) {
        return (
            <RoundedIcon
                name={type === 'walletConnect' ? 'walletConnect' : 'plugs'}
                iconSize={fallbackIconSizeMapping[size]}
                containerSize={sizeMapping[size]}
            />
        );
    }

    return (
        <Image
            source={{
                uri: `${IMAGE_PROXY_API_URL}?url=${encodeURIComponent(src)}`,
                headers: {
                    Authorization: `Bearer ${IMAGE_PROXY_API_AUTH_BEARER}`,
                },
            }}
            width={sizeMapping[size]}
            height={sizeMapping[size]}
            style={applyStyle(imageStyle, { size: sizeMapping[size] })}
            onError={() => setIsFallback(true)}
        />
    );
};
