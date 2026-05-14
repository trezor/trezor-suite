import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { suiteSyncToBip329 } from '@suite-common/bip329';
import { type AllLabelsForAccount, selectAllLabelsForAccount } from '@suite-common/suite-sync';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Button, CardWithIconLayout, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type CombinedLabelingState, selectAccountLabel } from '@suite-native/labeling';
import { useToast } from '@suite-native/toasts';
import { type StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

type AccountSettingsExportBip329CardProps = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    deviceStaticSessionId: StaticSessionId;
};

type ExportBip329Result =
    | { success: true }
    | { success: false; reason: 'fileSavingNotSupported' | 'exportFailed' };

const exportBip329 = async (
    accountLabel: string | null,
    labels: AllLabelsForAccount,
): Promise<ExportBip329Result> => {
    const labelsToExport = suiteSyncToBip329({
        outputLabels: labels.outputLabels,
        addressLabels: labels.addressLabels,
        allSpendable: true,
    });

    const jsonlString = labelsToExport.map(obj => JSON.stringify(obj)).join('\n');

    // Adding timestamp to filename to avoid overwriting files, since it gives error if file exists.
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${accountLabel ?? 'account_labels'}-${timestamp}.jsonl`;

    try {
        // Paths.cache gives you a directory for temporary files that can be cleaned up by the OS.
        const file = new File(Paths.cache, fileName);
        // Can throw an error if the file already exists or no permission to create it
        file.create();
        file.write(jsonlString);

        if (Platform.OS === 'android') {
            const dir = await Directory.pickDirectoryAsync();
            const newFile = dir.createFile(fileName, 'application/jsonl');
            await newFile.write(jsonlString);
        } else if (Platform.OS === 'ios') {
            await Sharing.shareAsync(file.uri, {
                mimeType: 'application/jsonl',
                UTI: 'public.jsonl',
            });
        } else {
            return { success: false, reason: 'fileSavingNotSupported' };
        }
    } catch {
        return { success: false, reason: 'exportFailed' };
    }

    return { success: true };
};

export const AccountSettingsExportBip329Card = ({
    accountDescriptor,
    networkSymbol,
    deviceStaticSessionId,
}: AccountSettingsExportBip329CardProps) => {
    const { showToast } = useToast();
    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, deviceStaticSessionId, accountDescriptor, networkSymbol),
    );
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
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
                message: (
                    <Translation id="moduleAccounts.accountSettingsExportBip329Button.exportSuccessfulToast" />
                ),
                icon: 'copy',
            });

            return;
        }

        switch (result.reason) {
            case 'exportFailed':
                showToast({
                    intent: 'critical',
                    message: (
                        <Translation id="moduleAccounts.accountSettingsExportBip329Button.exportFailedToast" />
                    ),
                });

                return;
            case 'fileSavingNotSupported':
                showToast({
                    intent: 'critical',
                    message: (
                        <Translation id="moduleAccounts.accountSettingsExportBip329Button.fileSavingNotSupported" />
                    ),
                });

                return;
            default:
                exhaustive(result.reason);
        }
    };

    return (
        <CardWithIconLayout
            icon="fileArrowDown"
            title={<Translation id="moduleAccounts.accountSettingsExportBip329Button.title" />}
        >
            <VStack marginTop="sp2" spacing="sp16">
                <Text
                    variant="body-sm"
                    color="contentSecondary"
                    adjustsFontSizeToFit
                    numberOfLines={3}
                >
                    <Translation id="moduleAccounts.accountSettingsExportBip329Button.description" />
                </Text>
                <Button size="medium" onPress={handleExport} intent="neutral" priority="secondary">
                    <Translation id="moduleAccounts.accountSettingsExportBip329Button.button" />
                </Button>
            </VStack>
        </CardWithIconLayout>
    );
};
