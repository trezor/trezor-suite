import { METADATA, selectLabelingDataForAccount, slip15ToBip329 } from '@suite/metadata';
import { type Bip329Label } from '@suite-common/bip329';
import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import {
    selectAllLabelsForAccount,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
    suiteSyncToBip329,
} from '@suite-common/suite-sync';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { sanitizeFilename } from '@trezor/utils';

import { type GetDefaultAccountLabelParams } from '../../hooks/suite/useDefaultAccountLabel';

export const exportMetadataToBip329File = createThunk<
    void,
    {
        getDefaultAccountLabel: (params: GetDefaultAccountLabelParams) => string;
        account: Account;
    },
    void
>(
    METADATA.EXPORT_METADATA_TO_BIP329_FILE,
    ({ account, getDefaultAccountLabel }, { dispatch, getState }) => {
        const showExportErrorToast = () => {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Exporting labels BIP 329 failed',
                }),
            );
        };

        try {
            const state = getState();
            const device = selectSelectedDevice(state);
            const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

            const staticSessionId = device?.state?.staticSessionId;
            if (!staticSessionId) {
                showExportErrorToast();

                return;
            }

            let finalAccountLabel = getDefaultAccountLabel({
                accountType: account.accountType,
                symbol: account.symbol,
                index: account.index,
            });
            let labelsToExport: Bip329Label[] = [];

            if (isSuiteSyncEnabled) {
                const owner = selectSuiteSyncOwnerForDeviceStaticId(state, staticSessionId);
                if (owner === null) {
                    showExportErrorToast();

                    return;
                }

                const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);

                const { accountLabel, addressLabels, outputLabels } = selectAllLabelsForAccount(
                    state,
                    {
                        walletDescriptor,
                        accountDescriptor: account.descriptor,
                        networkSymbol: account.symbol,
                    },
                );

                if (accountLabel) {
                    finalAccountLabel = accountLabel;
                }

                labelsToExport = suiteSyncToBip329({
                    outputLabels,
                    addressLabels,
                    allSpendable: true,
                });
            } else {
                // Legacy non-SuiteSync export.
                const accountMetadata = selectLabelingDataForAccount(state, account.key);
                if (accountMetadata.accountLabel) {
                    finalAccountLabel = accountMetadata.accountLabel;
                }
                labelsToExport = slip15ToBip329(accountMetadata);
            }

            // Maps each object to its JSON string representation
            const jsonlString = labelsToExport.map(obj => JSON.stringify(obj)).join('\n');

            const blob = new Blob([jsonlString], { type: 'application/jsonl' });

            const safeLabel = sanitizeFilename(finalAccountLabel);
            const filename = `${safeLabel || 'account_labels'}_export_bip329.jsonl`;

            triggerWebDownloadFile(blob, filename);
        } catch {
            showExportErrorToast();
        }
    },
);
