import { mergeStyleObjects, mergeNativeStyleObjects } from './mergeStyleObjects';
import { Style, NativeStyle, Styles, NativeStyles } from './types';

type BasicRecord = Record<string, unknown>;

type InvokeStyle<TProps extends BasicRecord> = (style: Style<TProps>) => ReturnType<Style<TProps>>;

type InvokeNativeStyle<TProps extends BasicRecord> = (
    style: NativeStyle<TProps>,
) => ReturnType<NativeStyle<TProps>>;

export const processStyles = <TProps extends BasicRecord>(
    styles: Styles<TProps>,
    invokeStyle: InvokeStyle<TProps>,
) =>
    mergeStyleObjects(
        styles.filter((style): style is Style<TProps> => style != null).map(invokeStyle),
    );

export const processNativeStyles = <TProps extends BasicRecord>(
    styles: NativeStyles<TProps>,
    invokeStyle: InvokeNativeStyle<TProps>,
) =>
    mergeNativeStyleObjects(
        styles.filter((style): style is NativeStyle<TProps> => style != null).map(invokeStyle),
    );
