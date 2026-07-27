import { toGetter } from '@suite-common/dependency-injection';
import { type WriteLabelsDep } from '@suite-common/suite-sync-types';

import { createWriteAccountLabel } from './account/createWriteAccountLabel';
import { createWriteAddressLabel } from './address/createWriteAddressLabel';
import { createWriteOutputLabel } from './output/createWriteOutputLabel';
import { createWriteWalletLabel } from './wallet/createWriteWalletLabel';
import { type SuiteSyncAnalyticsDep } from '../../suiteSyncAnalytics';
import { selectSuiteSyncAccountLabel } from '../account/selectSuiteSyncAccountLabel';
import { selectSuiteSyncAddressLabel } from '../address/suiteSyncAddressSelectors';
import { selectSuiteSyncOutputLabel } from '../output/suiteSyncOutputSelectors';
import { selectSuiteSyncWalletLabel } from '../wallet/suiteSyncWalletSelectors';

export type SuiteSyncWriteLabels = WriteLabelsDep;

export type CreateSuiteSyncWriteLabelsDeps = {
    getState: () => any;
} & SuiteSyncAnalyticsDep;

export const createSuiteSyncWriteLabels = (
    deps: CreateSuiteSyncWriteLabelsDeps,
): SuiteSyncWriteLabels => ({
    writeWalletLabel: createWriteWalletLabel({
        analytics: deps.analytics,
        getWalletLabel: toGetter(deps.getState, selectSuiteSyncWalletLabel),
    }),
    writeAccountLabel: createWriteAccountLabel({
        analytics: deps.analytics,
        getAccountLabel: toGetter(deps.getState, selectSuiteSyncAccountLabel),
    }),
    writeAddressLabel: createWriteAddressLabel({
        analytics: deps.analytics,
        getAddressLabel: toGetter(deps.getState, selectSuiteSyncAddressLabel),
    }),
    writeOutputLabel: createWriteOutputLabel({
        analytics: deps.analytics,
        getOutputLabel: toGetter(deps.getState, selectSuiteSyncOutputLabel),
    }),
});
