import { type ReactNode } from 'react';

import { type BoxProps } from '../Box';

export type NativeBlurViewProps = BoxProps & {
    children: ReactNode;
    isBlurred: boolean;
    blurIntensity: number;
};
