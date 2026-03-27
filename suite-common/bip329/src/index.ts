export { createBip329CompositionRoot } from './createBip329CompositionRoot';
export { suiteSyncToBip329 } from './suiteSync/suiteSyncToBip329';

import { type Account } from '@suite-common/wallet-types';

type ShouldDisplayExportBip329LabelsParams = {
    account: Account | null;
    isSuiteSyncEnabled: boolean;
    isMetadataEnabled?: boolean;
};

export const shouldDisplayExportBip329Labels = ({
    account,
    isSuiteSyncEnabled,
    isMetadataEnabled = false,
}: ShouldDisplayExportBip329LabelsParams): boolean =>
    account?.networkType === 'bitcoin' && (isSuiteSyncEnabled || isMetadataEnabled);
