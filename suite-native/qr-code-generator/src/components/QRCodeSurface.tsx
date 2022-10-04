import React from 'react';

import { Canvas } from '@shopify/react-native-skia';

type QRCodeSurfaceProps = {
    children: React.ReactNode;
    size: number;
};

export const QRCodeSurface = ({ children, size }: QRCodeSurfaceProps) => (
    <Canvas style={{ height: size, width: size }}>{children}</Canvas>
);
