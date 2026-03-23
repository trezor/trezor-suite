import { processNativeStyles } from './processStyles';
import { type NativeStyle, type NativeStyles } from './types';

export const mergeNativeStyles =
    <TProps extends Record<string, unknown>>(styles: NativeStyles<TProps>): NativeStyle<TProps> =>
    (utils, props) =>
        processNativeStyles(styles, style => style(utils, props));
