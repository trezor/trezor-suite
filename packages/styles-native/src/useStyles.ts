import { useCallback, useContext, useMemo } from 'react';
import { RendererContext, ThemeContext } from 'react-fela';

import { type TRule } from 'fela';
import { darken, lighten, transparentize } from 'polished';

import {
    type ColorTransformFunction,
    getValueAndUnit,
    isDarkColor,
    multiply,
    negative,
    sum,
    useDirection,
} from '@trezor/styles-common';
import { type NativeTheme } from '@trezor/theme';

import { processNativeStyles } from './processStyles';
import {
    type NativeStyle,
    type NativeStyleObject,
    type NativeStyleOrStylesParam,
    type NativeStyleUtils,
} from './types';

const sharedUtils = {
    darken: darken as ColorTransformFunction,
    getValueAndUnit,
    isDarkColor,
    lighten: lighten as ColorTransformFunction,
    multiply,
    negative,
    sum,
    transparentize: transparentize as ColorTransformFunction,
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

        const invokeStyle = (style: NativeStyle<TProps>) =>
            style(nativeUtils, props ?? ({} as TProps));

        const rule = () => {
            if (Array.isArray(styleOrStyles)) {
                return processNativeStyles(styleOrStyles, invokeStyle);
            }

            return processNativeStyles([styleOrStyles], invokeStyle);
        };

        return renderer.renderRule(rule as unknown as TRule, {}) as unknown as NativeStyleObject;
    };

    const memoizedApplyNativeStyle = useCallback(applyNativeStyle, [renderer, nativeUtils]);

    return {
        applyStyle: memoizedApplyNativeStyle,
        utils: nativeUtils,
    };
};
