import {
    Style,
    NativeStyle,
    StyleUtils,
    StyleObject,
    NativeStyleUtils,
    NativeStyleObject,
} from './types';

type BasicRecord = Record<string, unknown>;

export const prepareStyle = <TProps extends BasicRecord>(style: Style<TProps>) => style;

export const prepareNativeStyle = <TProps extends BasicRecord>(style: NativeStyle<TProps>) => style;

export const prepareStyleFactory =
    <TOurProps extends BasicRecord, TTheirProps extends BasicRecord = BasicRecord>(
        style: (utils: StyleUtils, ourProps: TOurProps, theirProps: TTheirProps) => StyleObject,
    ) =>
    (ourProps: TOurProps): Style<TTheirProps> =>
    (utils, theirProps) =>
        style(utils, ourProps, theirProps);

export const prepareNativeStyleFactory =
    <TOurProps extends BasicRecord, TTheirProps extends BasicRecord = BasicRecord>(
        style: (
            utils: NativeStyleUtils,
            ourProps: TOurProps,
            theirProps: TTheirProps,
        ) => NativeStyleObject,
    ) =>
    (ourProps: TOurProps): NativeStyle<TTheirProps> =>
    (utils, theirProps) =>
        style(utils, ourProps, theirProps);
