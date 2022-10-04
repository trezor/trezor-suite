import React from 'react';

import { Path } from '@shopify/react-native-skia';

type QRCodeCellProps = {
    d: string;
    fill: string;
    transformX: number;
    transformY: number;
};

export const QRCodeCell = ({ d, fill, transformX, transformY }: QRCodeCellProps) => (
    <Path
        path={d}
        color={fill}
        transform={[{ translateX: transformX }, { translateY: transformY }]}
    />
);
