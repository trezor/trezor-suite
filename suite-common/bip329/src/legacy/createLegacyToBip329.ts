import { type ExportBip329 } from '@suite-common/bip329-types';
import { type AccountLabels } from '@suite-common/metadata-types';
import { type AccountKey } from '@suite-common/wallet-types';

import { slip15ToBip329 } from './slip15ToBip329';

export type GetLegacyAccountLabels = (accountKey: AccountKey) => AccountLabels;

export type GetLegacyAccountLabelsDep = {
    getLegacyAccountLabels: GetLegacyAccountLabels;
};

export type LegacyToBip329Dep = { legacyToBip329: ExportBip329 };

export const createLegacyToBip329 =
    (deps: GetLegacyAccountLabelsDep): ExportBip329 =>
    ({ account }) => {
        const accountLabels = deps.getLegacyAccountLabels(account.key);

        return {
            accountLabel: accountLabels.accountLabel ?? null,
            labelsToExport: slip15ToBip329(accountLabels),
        };
    };
