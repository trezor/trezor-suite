import { isDesktop } from '@trezor/env-utils';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { createThunk } from '@suite-common/redux-utils';
import { FIRMWARE_MODULE_PREFIX } from './firmwareActions';

/**
 * Get URL for firmware binaries, which may be local (suite desktop) or remote (suite web)
 */
export const getBinFilesBaseUrlThunk = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/getBinFilesBaseUrlThunk`,
    (_params, { getState, extra }) =>
        isDesktop()
            ? extra.selectors.selectDesktopBinDir(getState())
            : resolveStaticPath('connect/data'),
);
