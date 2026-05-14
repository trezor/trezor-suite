import { type NativeStyle, type NativeStyleObject, type NativeStyleUtils } from './types';

type BasicRecord = Record<string, unknown>;

export const prepareNativeStyle = <TProps extends BasicRecord>(style: NativeStyle<TProps>) => style;

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
