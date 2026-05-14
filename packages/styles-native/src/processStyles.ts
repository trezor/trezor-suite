import { mergeNativeStyleObjects } from './mergeStyleObjects';
import { type NativeStyle, type NativeStyles } from './types';

type BasicRecord = Record<string, unknown>;

type InvokeNativeStyle<TProps extends BasicRecord> = (
    style: NativeStyle<TProps>,
) => ReturnType<NativeStyle<TProps>>;

export const processNativeStyles = <TProps extends BasicRecord>(
    styles: NativeStyles<TProps>,
    invokeStyle: InvokeNativeStyle<TProps>,
) =>
    mergeNativeStyleObjects(
        styles.filter((style): style is NativeStyle<TProps> => style != null).map(invokeStyle),
    );
