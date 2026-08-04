import { type Getter } from '@suite-common/dependency-injection';
import { createThunk } from '@suite-common/redux-utils';
import { isDesktop, resolveConnectPath } from '@trezor/env-utils';

import { FIRMWARE_MODULE_PREFIX } from './firmwareActions';

/**
 * Get URL for firmware binaries, which may be local (suite desktop) or remote (suite web)
 */
export type GetDesktopBinDirDep = {
    getDesktopBinDir: Getter<[], string | undefined>;
};

export type GetBinFilesBaseUrlThunkDeps = {
    services: GetDesktopBinDirDep;
};

export const getBinFilesBaseUrlThunk = createThunk<
    string | undefined,
    void,
    { extra: GetBinFilesBaseUrlThunkDeps }
>(`${FIRMWARE_MODULE_PREFIX}/getBinFilesBaseUrlThunk`, (_params, { extra }) =>
    isDesktop() ? extra.services.getDesktopBinDir() : resolveConnectPath('data'),
);
