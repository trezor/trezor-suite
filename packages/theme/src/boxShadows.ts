import { type Colors } from './colors';
import { type CSSColor } from './types';

export const boxShadows = {
    elementShadowElevated: ({ shadowKeyElevated, shadowAmbientElevated }: Colors) =>
        `0px 2px 4px -2px ${shadowKeyElevated}, 0px 0px 2px 0px ${shadowAmbientElevated}`,
    surfaceShadowAction: ({ shadowKeyAction, shadowAmbientAction }: Colors) =>
        `0px 8px 16px -2px ${shadowKeyAction}, 0px 0px 8px 0px ${shadowAmbientAction}`,
    surfaceShadowActionHovered: ({ shadowKeyActionHover, shadowAmbientActionHover }: Colors) =>
        `0px 12px 20px -2px ${shadowKeyActionHover}, 0px 0px 12px 0px ${shadowAmbientActionHover}`,
    surfaceShadowModeless: ({ shadowKeyModeless, shadowAmbientModeless }: Colors) =>
        `0px 12px 20px -2px ${shadowKeyModeless}, 0px 0px 12px 0px ${shadowAmbientModeless}`,
    surfaceShadowFixed: ({ shadowKeyFixed, shadowAmbientFixed }: Colors) =>
        `0px 16px 24px -2px ${shadowKeyFixed}, 0px 0px 16px 0px ${shadowAmbientFixed}`,
    surfaceShadowModal: ({ shadowKeyModal, shadowAmbientModal }: Colors) =>
        `0px 32px 64px -4px ${shadowKeyModal}, 0px 0px 32px 0px ${shadowAmbientModal}`,
} as const satisfies Record<string, (theme: Colors) => string>;

export type BoxShadow = keyof typeof boxShadows;
export type BoxShadows = Record<BoxShadow, string>;

export const mapBoxShadowsToCSS = (theme: Colors): Record<BoxShadow, string> =>
    Object.fromEntries(
        Object.entries(boxShadows).map(([name, getBoxShadow]) => [name, getBoxShadow(theme)]),
    ) as Record<BoxShadow, string>;

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
    none: {
        elevation: 0,
        shadowColor: 'rgba(0, 0, 0, 0)',
        shadowOffset: {
            height: 0,
            width: 0,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
    },
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
