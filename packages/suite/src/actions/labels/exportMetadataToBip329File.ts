import { METADATA } from '@suite/metadata';
import { createThunk } from '@suite-common/redux-utils';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { sanitizeFilename } from '@trezor/utils';

export const exportMetadataToBip329File = createThunk<
    void,
    {
        account: Account;
        defaultAccountLabel: string;
    },
    void
>(
    METADATA.EXPORT_METADATA_TO_BIP329_FILE,
    ({ account, defaultAccountLabel }, { dispatch, extra: { services } }) => {
        const showExportErrorToast = () => {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Exporting labels BIP 329 failed',
                }),
            );
        };

        try {
            const { accountLabel, labelsToExport } = services.bip329.export({
                account,
            });

            const safeLabel = sanitizeFilename(accountLabel ?? defaultAccountLabel);

            const jsonlString = labelsToExport.map(obj => JSON.stringify(obj)).join('\n');
            const blob = new Blob([jsonlString], { type: 'application/jsonl' });
            const filename = `${safeLabel || 'account_labels'}_export_bip329.jsonl`;

            triggerWebDownloadFile(blob, filename);
        } catch {
            showExportErrorToast();
        }
    },
);
