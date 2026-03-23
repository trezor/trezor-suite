import type * as RN from 'react-native';

import type { UniversalStyleUtils } from '@trezor/styles-common';
import type { CSSColor, NativeTheme } from '@trezor/theme';

export interface NativeStyleUtils extends NativeTheme, UniversalStyleUtils {}

interface ConditionalExtend<TStyleObject extends object = NativeStyleObject> {
    condition: boolean;
    style: TStyleObject;
}

export type NativeStyleObject = RN.TextStyle &
    RN.ViewStyle &
    RN.ImageStyle & {
        extend?: ConditionalExtend<NativeStyleObject> | Array<ConditionalExtend<NativeStyleObject>>;
    } & {
        backgroundColor?: CSSColor;
        borderColor?: CSSColor;
        borderBottomColor?: CSSColor;
        borderLeftColor?: CSSColor;
        borderRightColor?: CSSColor;
        borderTopColor?: CSSColor;
        color?: CSSColor;
    };

export type NativeStyle<TProps extends object = object> = (
    utils: NativeStyleUtils,
    props: TProps,
) => NativeStyleObject;
export type NativeStyles<TProps extends object> = Array<NativeStyle<TProps> | null | undefined>;
export type NativeStyleOrStylesParam<TProps extends object> =
    | NativeStyle<TProps>
    | NativeStyles<TProps>;
