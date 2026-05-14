import { type Bip329Dep } from '@suite-common/bip329-types';

import { type GetIsSuiteSyncEnabledDep, createBip329 } from './createBip329';
import {
    type GetLegacyAccountLabelsDep,
    createLegacyToBip329,
} from './legacy/createLegacyToBip329';
import {
    type ImportBip329ToSuiteSyncDeps,
    createBip329ToSuiteSync,
} from './suiteSync/createBip329ToSuiteSync';
import {
    type GetAllLabelsForAccountDeps,
    createSuiteSyncToBip329,
} from './suiteSync/createSuiteSyncToBip329';

type CreateBip329CompositionRootDeps = GetIsSuiteSyncEnabledDep &
    GetLegacyAccountLabelsDep &
    GetAllLabelsForAccountDeps &
    ImportBip329ToSuiteSyncDeps;

export const createBip329CompositionRoot = (deps: CreateBip329CompositionRootDeps): Bip329Dep => {
    const legacyToBip329 = createLegacyToBip329({
        getLegacyAccountLabels: deps.getLegacyAccountLabels,
    });

    const exportSuiteSyncToBip329 = createSuiteSyncToBip329({
        getAllLabelsForAccount: deps.getAllLabelsForAccount,
    });

    const importBip329ToSuiteSync = createBip329ToSuiteSync({
        updateAddressLabel: deps.updateAddressLabel,
        updateOutputLabel: deps.updateOutputLabel,
    });

    return {
        bip329: createBip329({
            getIsSuiteSyncEnabled: deps.getIsSuiteSyncEnabled,
            legacyToBip329,
            exportSuiteSyncToBip329,
            importBip329ToSuiteSync,
        }),
    };
};
