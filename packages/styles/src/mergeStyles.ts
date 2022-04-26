import { processNativeStyles, processStyles } from './processStyles';
import { NativeStyle, NativeStyles, Style, Styles } from './types';

export const mergeStyles =
    <TProps extends Record<string, unknown>>(styles: Styles<TProps>): Style<TProps> =>
    (utils, props) =>
        processStyles(styles, style => style(utils, props));

export const mergeNativeStyles =
    <TProps extends Record<string, unknown>>(styles: NativeStyles<TProps>): NativeStyle<TProps> =>
    (utils, props) =>
        processNativeStyles(styles, style => style(utils, props));
