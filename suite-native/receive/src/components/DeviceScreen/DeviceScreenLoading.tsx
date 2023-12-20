import { useState, useEffect } from 'react';

import { SkFont, Text as SkiaText } from '@shopify/react-native-skia';

import { DEVICE_TEXT_COLOR } from '../../constants';

type DeviceScreenLoadingProps = {
    isLoading: boolean;
    font: SkFont | null;
    xOffset: number;
    yOffset: number;
    text: string;
};

export const DeviceScreenLoading = ({
    isLoading,
    font,
    xOffset,
    yOffset,
    text,
}: DeviceScreenLoadingProps) => {
    const [visibleDots, setVisibleDots] = useState<number>(3);

    useEffect(() => {
        if (!isLoading) return;
        const timer = setTimeout(() => {
            if (isLoading) {
                setVisibleDots((visibleDots + 1) % 4);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [setVisibleDots, isLoading, visibleDots]);

    const textWithDots = `${text}${Array(visibleDots).fill('.').join('')}`;

    if (!isLoading) return null;

    return (
        <SkiaText
            key="address_loading"
            x={xOffset}
            y={yOffset}
            text={textWithDots}
            font={font}
            color={DEVICE_TEXT_COLOR}
        />
    );
};
