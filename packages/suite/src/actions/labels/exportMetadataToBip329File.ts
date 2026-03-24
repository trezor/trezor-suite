import { METADATA } from '@suite/metadata';
import { createThunk } from '@suite-common/redux-utils';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
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
    ({ account, getDefaultAccountLabel }, { dispatch, extra: { services } }) => {
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

            const safeLabel = sanitizeFilename(
                accountLabel ??
                    getDefaultAccountLabel({
                        accountType: account.accountType,
                        symbol: account.symbol,
                        index: account.index,
                    }),
            );

            const jsonlString = labelsToExport.map(obj => JSON.stringify(obj)).join('\n');
            const blob = new Blob([jsonlString], { type: 'application/jsonl' });
            const filename = `${safeLabel || 'account_labels'}_export_bip329.jsonl`;

            triggerWebDownloadFile(blob, filename);
        } catch {
            showExportErrorToast();
        }
    },
);
