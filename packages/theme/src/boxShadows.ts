import { CSSColor } from './types';

export const boxShadows = {
    standard: {
        boxShadowFocused: '0px 0px 0px 3px rgba(0, 120, 172, 0.25)',
        boxShadowBase: '0px 2px 4px 0px rgba(0, 0, 0, 0.04)',
        boxShadowElevated: '0px 16px 32px -16px rgba(0, 0, 0, 0.16)',
    },
    dark: {
        boxShadowFocused: '0px 0px 0px 3px rgba(89, 175, 211, 0.42)',
        boxShadowBase: '0px 0 0px 0.5px rgba(255, 255, 255, 0.16)',
        boxShadowElevated: '0px 0 0px 2px rgba(255, 255, 255, 0.16)',
    },
};

export type BoxShadow = keyof typeof boxShadows.standard;
export type BoxShadows = Record<BoxShadow, string>;

interface NativeBoxShadowDefinition {
    elevation: number;
    shadowColor: CSSColor;
    shadowOffset: {
        height: number;
        width: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
}

export const nativeBoxShadows: Record<string, NativeBoxShadowDefinition> = {
    small: {
        elevation: 2,
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: {
            height: 2,
            width: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    medium: {
        elevation: 3,
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: {
            height: 16,
            width: 0,
        },
        shadowOpacity: 0.16,
        shadowRadius: 16,
    },
};

export type NativeBoxShadow = keyof typeof nativeBoxShadows;
export type NativeBoxShadows = Record<NativeBoxShadow, NativeBoxShadowDefinition>;
