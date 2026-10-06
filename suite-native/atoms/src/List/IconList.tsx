import { type ReactNode, createContext } from 'react';

import type { NativeTypographyStyle } from '@trezor/theme';

import type { IconSquareIntent, IconSquareSize } from '../Icon/IconSquare';
import { VStack } from '../Stack';

type IconListContextProps = {
    iconIntent?: IconSquareIntent;
    iconSize?: IconSquareSize;
    verticalAlign?: 'flex-start' | 'center';
    textVariant?: NativeTypographyStyle;
};

export type IconListProps = IconListContextProps & {
    children: ReactNode;
};

export const IconListContext = createContext<IconListContextProps>({});

export const IconList = ({ children, ...contextProps }: IconListProps) => (
    <IconListContext.Provider value={contextProps}>
        <VStack spacing="sp16">{children}</VStack>
    </IconListContext.Provider>
);
