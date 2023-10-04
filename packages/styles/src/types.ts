import type * as RN from 'react-native';

import type * as CSS from 'csstype';

// TODO: In the future, we might want to move the `theme` to a standalone module and instead
// use an ambient module declaration instead of importing it here, just like Emotion does.
// https://emotion.sh/docs/typescript#define-a-theme
import type { Theme, NativeTheme, CSSColor } from '@trezor/theme';

import type { multiply, getValueAndUnit, sum, negative, isDarkColor } from './utils';
import type { mediaQueries } from './mediaQueries';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type Direction = 'ltr' | 'rtl';

type MediaQuery = string;

type NonZeroBreakpoint = Exclude<Breakpoint, 'xs'>;
type BelowBreakpoints = `below_${NonZeroBreakpoint}`;

export type BreakpointMediaQueries = Record<NonZeroBreakpoint | BelowBreakpoints, MediaQuery>;

export interface DirectionUtils {
    direction: Direction;
    isLtr: boolean;
    isRtl: boolean;
}

export type ColorTransformFunction = (amount: string | number, color: CSSColor) => CSSColor;

export interface UniversalStyleUtils extends DirectionUtils {
    getValueAndUnit: typeof getValueAndUnit;
    multiply: typeof multiply;
    sum: typeof sum;
    negative: typeof negative;
    darken: ColorTransformFunction;
    lighten: ColorTransformFunction;
    transparentize: ColorTransformFunction;
    isDarkColor: typeof isDarkColor;
}

export interface StyleUtils extends Theme, UniversalStyleUtils {
    breakpoints: BreakpointMediaQueries;
    media: typeof mediaQueries;
}

export interface NativeStyleUtils extends NativeTheme, UniversalStyleUtils {}

export type PlainStyleObject = CSS.Properties<string | number>;

type DisallowedPropertyName =
    // NOTE: Common typo, only `extend` is correct.
    // TODO: Investigate using an ESLint rule instead to avoid code completion of this property.
    'extends';

type PlainResponsiveStyleObject = {
    [KPropertyName in Exclude<keyof PlainStyleObject, DisallowedPropertyName>]?:
        | PlainStyleObject[KPropertyName]
        | {
              [KBreakpoint in Breakpoint]?: PlainStyleObject[KPropertyName];
          };
} & {
    [KPropertyName in DisallowedPropertyName]?: never;
};

type KeyframeSelector = string;

interface ConditionalExtend<TStyleObject extends object = StyleObject> {
    condition: boolean;
    style: TStyleObject;
}

// NOTE: Keyframes cannot include selectors or responsive values by design.
export type Keyframes = Record<KeyframeSelector, PlainStyleObject>;

export type StyleObject = Omit<PlainResponsiveStyleObject, 'animationName'> & {
    animationName?: Keyframes | Keyframes[];
    extend?: ConditionalExtend | ConditionalExtend[];
    selectors?: {
        // TODO: Add support for IntelliSense of common selectors, such as pseudo-classes.
        [selector: string]: StyleObject;
    };
};

export type NativeStyleObject = RN.TextStyle &
    RN.ViewStyle &
    RN.ImageStyle & {
        extend?: ConditionalExtend<NativeStyleObject> | Array<ConditionalExtend<NativeStyleObject>>;
    } & {
        // More strict color type than default one, feel free to add more valid properties, only most used are here
        backgroundColor?: CSSColor;
        borderColor?: CSSColor;
        borderBottomColor?: CSSColor;
        borderLeftColor?: CSSColor;
        borderRightColor?: CSSColor;
        borderTopColor?: CSSColor;
        color?: CSSColor;
    };

export type Style<TProps extends object = object> = (
    utils: StyleUtils,
    props: TProps,
) => StyleObject;
export type Styles<TProps extends object> = Array<Style<TProps> | null | undefined>;
export type StyleOrStylesParam<TProps extends object> = Style<TProps> | Styles<TProps>;

export type NativeStyle<TProps extends object = object> = (
    utils: NativeStyleUtils,
    props: TProps,
) => NativeStyleObject;
export type NativeStyles<TProps extends object> = Array<NativeStyle<TProps> | null | undefined>;
export type NativeStyleOrStylesParam<TProps extends object> =
    | NativeStyle<TProps>
    | NativeStyles<TProps>;
