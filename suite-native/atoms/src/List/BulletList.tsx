import { type ReactNode, createContext } from 'react';

import type { Color, NativeSpacing, NativeTypographyStyle } from '@trezor/theme';

import { VStack } from '../Stack';

type BulletListContextProps = {
    textVariant?: NativeTypographyStyle;
    textColor?: Color;
};

export type BulletListProps = BulletListContextProps & {
    spacing?: NativeSpacing | number;
    children: ReactNode;
};

export const BulletListContext = createContext<BulletListContextProps>({});

export const BulletList = ({ spacing = 0, children, ...contextProps }: BulletListProps) => (
    <BulletListContext.Provider value={contextProps}>
        <VStack spacing={spacing}>{children}</VStack>
    </BulletListContext.Provider>
);
