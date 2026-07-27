import { type Bip329 } from '@suite-common/bip329-types';
import { ok } from '@trezor/type-utils';

import { type LegacyToBip329Dep } from './legacy/createLegacyToBip329';
import { type ImportBip329ToSuiteSyncDep } from './suiteSync/createBip329ToSuiteSync';
import { type ExportSuiteSyncToBip329Dep } from './suiteSync/createSuiteSyncToBip329';

export type GetIsSuiteSyncEnabled = () => boolean;

export type GetIsSuiteSyncEnabledDep = {
    getIsSuiteSyncEnabled: GetIsSuiteSyncEnabled;
};

export type CreateBip329Deps = GetIsSuiteSyncEnabledDep &
    LegacyToBip329Dep &
    ExportSuiteSyncToBip329Dep &
    ImportBip329ToSuiteSyncDep;

export const createBip329 = (deps: CreateBip329Deps): Bip329 => ({
    export: params => {
        if (deps.getIsSuiteSyncEnabled()) {
            return deps.exportSuiteSyncToBip329(params);
        }

        return deps.legacyToBip329({
            account: params.account,
        });
    },
    import: params => {
        if (!deps.getIsSuiteSyncEnabled()) {
            return Promise.resolve(ok());
        }

        return deps.importBip329ToSuiteSync(params);
    },
});
