import { createThunk } from '@suite-common/redux-utils';

import { FIRMWARE_MODULE_PREFIX } from './firmwareActions';

/**
 * Get URL for firmware binaries, which may be local (suite desktop) or remote (suite web/native).
 * The remote base URL is injected via the composition root; on desktop it is undefined and the
 * local bin dir is resolved from the (desktop-only) handshake state instead.
 */
export const getBinFilesBaseUrlThunk = createThunk(
    `${FIRMWARE_MODULE_PREFIX}/getBinFilesBaseUrlThunk`,
    (_params, { getState, extra }) =>
        extra.services.binFilesBaseUrl ?? extra.selectors.selectDesktopBinDir(getState()),
);
