import { useCallback, useContext, useMemo } from 'react';

import { Theme, NativeTheme } from '@trezor/theme';
import { darken, lighten, transparentize } from 'polished';
import { RendererContext, ThemeContext } from 'react-fela';

import { breakpointMediaQueries } from './breakpoints';
import { mediaQueries } from './mediaQueries';
import { processStyles, processNativeStyles } from './processStyles';
import {
    NativeStyle,
    NativeStyleObject,
    NativeStyleOrStylesParam,
    NativeStyleUtils,
    Style,
    StyleOrStylesParam,
    StyleUtils,
} from './types';
import { useDirection } from './useDirection';
import { multiply, getValueAndUnit, sum } from './utils';

const sharedUtils = {
    darken,
    getValueAndUnit,
    lighten,
    multiply,
    sum,
    transparentize,
};

export const useStyles = () => {
    const renderer = useContext(RendererContext);

    if (!renderer) {
        throw new Error('The `useStyles()` hook can only be used inside a `StylesProvider`.');
    }

    const theme = useContext(ThemeContext) as Theme;
    const directionUtils = useDirection();

    const utils: StyleUtils = useMemo(
        () => ({
            ...theme,
            ...directionUtils,
            ...sharedUtils,
            breakpoints: breakpointMediaQueries,
            media: mediaQueries,
        }),
        [directionUtils, theme],
    );

    const applyStyle = <TProps extends Record<string, unknown>>(
        ...params: Record<string, unknown> extends TProps
            ? [styleOrStyles: StyleOrStylesParam<TProps>, props?: TProps]
            : [styleOrStyles: StyleOrStylesParam<TProps>, props: TProps]
    ) => {
        const [styleOrStyles, props] = params;

        const invokeStyle = (style: Style<any>) => style(utils, props ?? {});

        const rule = () => {
            if (Array.isArray(styleOrStyles)) {
                return processStyles(styleOrStyles, invokeStyle);
            }

            return processStyles([styleOrStyles], invokeStyle);
        };

        // NOTE: `fela-plugin-bidi` depends on `theme.direction` being set.
        // NOTE: The default behaviour of `useFela` is to pass `propsWithTheme` down. Our props will
        // never have a standardized structure, so we don't want any of our plugins to depend on them.
        return renderer.renderRule(rule as any, { theme: { direction: directionUtils.direction } });
    };

    const applyGlobalStyle = (style: Style, selector: string) =>
        renderer.renderStatic(style(utils, {}) as any, selector);

    const memoizedApplyStyle = useCallback(applyStyle, [renderer, utils, directionUtils]);
    const memoizedApplyGlobalStyle = useCallback(applyGlobalStyle, [renderer, utils]);

    return {
        applyStyle: memoizedApplyStyle,
        applyGlobalStyle: memoizedApplyGlobalStyle,
        utils,
    };
};

export const useNativeStyles = () => {
    const renderer = useContext(RendererContext);

    if (!renderer) {
        throw new Error('The `useNativeStyles()` hook can only be used inside a `StylesProvider`.');
    }

    const nativeTheme = useContext(ThemeContext) as NativeTheme;
    const directionUtils = useDirection();

    const nativeUtils: NativeStyleUtils = useMemo(
        () => ({
            ...nativeTheme,
            ...directionUtils,
            ...sharedUtils,
        }),
        [directionUtils, nativeTheme],
    );

    const applyNativeStyle = <TProps extends Record<string, unknown>>(
        ...params: Record<string, unknown> extends TProps
            ? [styleOrStyles: NativeStyleOrStylesParam<TProps>, props?: TProps]
            : [styleOrStyles: NativeStyleOrStylesParam<TProps>, props: TProps]
    ) => {
        const [styleOrStyles, props] = params;

        const invokeStyle = (style: NativeStyle<any>) => style(nativeUtils, props ?? {});

        const rule = () => {
            if (Array.isArray(styleOrStyles)) {
                return processNativeStyles(styleOrStyles, invokeStyle);
            }

            return processNativeStyles([styleOrStyles], invokeStyle);
        };

        return renderer.renderRule(rule as any, {}) as NativeStyleObject;
    };

    const memoizedApplyNativeStyle = useCallback(applyNativeStyle, [renderer, nativeUtils]);

    return {
        applyStyle: memoizedApplyNativeStyle,
        utils: nativeUtils,
    };
};
