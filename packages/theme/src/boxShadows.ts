import { CSSColor } from './types';

export const boxShadows = {
    s: '0px 2px 4px rgba(0, 0, 0, 0.04)',
    // TODO: next shadows needs to be defined
    m: '0px 2px 4px rgba(0, 0, 0, 0.04)',
    big: '0px 2px 4px rgba(0, 0, 0, 0.04)',
};

export type BoxShadow = keyof typeof boxShadows;
export type BoxShadows = typeof boxShadows;

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
};

export type NativeBoxShadow = keyof typeof nativeBoxShadows;
export type NativeBoxShadows = Record<NativeBoxShadow, NativeBoxShadowDefinition>;
