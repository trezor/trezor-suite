import { useSelector } from 'react-redux';

import { selectAllLabelsForAccount } from '@suite-common/suite-sync';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { selectAccountLabel } from '@suite-native/accounts';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type CombinedLabelingState } from '@suite-native/labeling';
import { useToast } from '@suite-native/toasts';
import { type StaticSessionId, parseStaticSessionId } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

import { exportBip329 } from './exportBip329';

type Bip329ExportButtonProps = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    deviceStaticSessionId: StaticSessionId;
};

export const Bip329ExportButton = ({
    accountDescriptor,
    networkSymbol,
    deviceStaticSessionId,
}: Bip329ExportButtonProps) => {
    const { showToast } = useToast();

    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, networkSymbol),
    );
    const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);
    const labels = useSelector((state: CombinedLabelingState) =>
        selectAllLabelsForAccount(state, {
            walletDescriptor,
            accountDescriptor,
            networkSymbol,
        }),
    );

    const handleExport = async () => {
        const result = await exportBip329(accountLabel, labels);

        if (result.success) {
            showToast({
                intent: 'neutral',
                icon: 'copy',
                message: (
                    <Translation id="moduleAccounts.accountSettingsBip329.export.exportSuccessfulToast" />
                ),
            });

            return;
        }

        switch (result.reason) {
            case 'cancelled':
                // User dismissed the directory picker; nothing to report.
                return;
            case 'exportFailed':
                showToast({
                    intent: 'critical',
                    message: (
                        <Translation id="moduleAccounts.accountSettingsBip329.export.exportFailedToast" />
                    ),
                });

                return;
            case 'fileSavingNotSupported':
                showToast({
                    intent: 'critical',
                    message: (
                        <Translation id="moduleAccounts.accountSettingsBip329.export.fileSavingNotSupported" />
                    ),
                });

                return;
            default:
                exhaustive(result.reason);
        }
    };

    return (
        <Button size="medium" onPress={handleExport} intent="neutral" priority="secondary">
            <Translation id="moduleAccounts.accountSettingsBip329.exportButton" />
        </Button>
    );
};
