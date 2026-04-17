import { useState } from 'react';

import { Image, RoundedIcon } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { IMAGE_PROXY_API_AUTH_BEARER, IMAGE_PROXY_API_URL } from '@trezor/urls';

const imageSizeMapping = {
    medium: 48,
    large: 60,
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
            <RoundedIcon name={type === 'walletConnect' ? 'walletConnect' : 'plugs'} size={48} />
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
            width={imageSizeMapping[size]}
            height={imageSizeMapping[size]}
            style={applyStyle(imageStyle, { size: imageSizeMapping[size] })}
            onError={() => setIsFallback(true)}
        />
    );
};
