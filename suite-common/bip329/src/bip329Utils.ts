import { type Account } from '@suite-common/wallet-types';

type ShouldDisplayExportImportBip329LabelsParams = {
    account: Account | null;
    isSuiteSyncEnabled: boolean;
    isMetadataEnabled?: boolean;
};

export const shouldDisplayExportImportBip329Labels = ({
    account,
    isSuiteSyncEnabled,
    isMetadataEnabled = false,
}: ShouldDisplayExportImportBip329LabelsParams): boolean =>
    account?.networkType === 'bitcoin' && (isSuiteSyncEnabled || isMetadataEnabled);
