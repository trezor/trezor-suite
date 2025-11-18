import { IMAGES_PATH } from '@trezor/components';
import { resolveStaticPath } from '@trezor/env-utils';

export const LOGOS: { [key: string]: any } = {
    HORIZONTAL: resolveStaticPath(`${IMAGES_PATH}/logos/trezor_logo_horizontal.svg`),
    VERTICAL: resolveStaticPath(`${IMAGES_PATH}/logos/trezor_logo_vertical.svg`),
    SYMBOL: resolveStaticPath(`${IMAGES_PATH}/logos/trezor_logo_symbol.svg`),
};
