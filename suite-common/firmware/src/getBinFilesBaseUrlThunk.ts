import { createThunk } from '@suite-common/redux-utils';
import { isDesktop, resolveConnectPath } from '@trezor/env-utils';

import { FIRMWARE_MODULE_PREFIX } from './firmwareActions';

/**
 * Get URL for firmware binaries, which may be local (suite desktop) or remote (suite web)
 */
export const getBinFilesBaseUrlThunk = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/getBinFilesBaseUrlThunk`,
    (_params, { extra }) =>
        isDesktop() ? extra.services.getDesktopBinDir() : resolveConnectPath('data'),
);
