import { Platform } from 'react-native';
import { useSelector, useStore } from 'react-redux';

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
    WithLabelingState,
    selectAddressLabelsByAccount,
    selectOutputLabelsByAccount,
    suiteSyncToBip329,
} from '@suite-common/suite-sync';
import {
    AccountsRootState,
    selectAccountByKey,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { BottomSheetModal, BottomSheetModalRef, Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';

import { ExportBip329InfoHeader } from './ExportBip329InfoHeader';
import { CombinedLabelingState, selectAccountLabel } from '../selectors';

type ExportBip329BottomSheetProps = {
    onClose: () => void;
    ref: BottomSheetModalRef;
    accountKey: string;
};

export const ExportBip329BottomSheet = ({
    onClose,
    ref,
    accountKey,
}: ExportBip329BottomSheetProps) => {
    const store = useStore();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountLabel = useSelector((state: CombinedLabelingState) =>
        selectAccountLabel(state, account?.key),
    );
    const { showToast } = useToast();

    const device = useSelector(selectSelectedDevice);
    const staticSessionId = device?.state?.staticSessionId;

    const getLabels = () => {
        // Usually we would use useSelector here, but since those are not used in UI
        // they are just used for file downloading, we get them when user request the file.
        const state = store.getState() as WithLabelingState;

        if (!staticSessionId || !account) {
            return { outputLabels: [], addressLabels: [] };
        }

        const outputLabels = selectOutputLabelsByAccount({
            state,
            deviceStaticSessionId: staticSessionId,
            accountDescriptor: account.descriptor,
            networkSymbol: account.symbol,
        });

        const addressLabels = selectAddressLabelsByAccount({
            state,
            deviceStaticSessionId: staticSessionId,
            accountDescriptor: account.descriptor,
            networkSymbol: account.symbol,
        });

        return { outputLabels, addressLabels };
    };

    const handleExportBip329 = async () => {
        const labels = getLabels();
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
                // Just sanity final else, but this should never happen.
                showToast({
                    variant: 'error',
                    message: 'File saving is not supported on this platform.',
                });

                return;
            }
        } catch {
            showToast({
                variant: 'error',
                message: 'Failed to export labels.',
            });

            return;
        }

        onClose();
        showToast({
            variant: 'default',
            message: 'Labels exported.',
            icon: 'copy',
        });
    };

    return (
        <BottomSheetModal
            ref={ref}
            isCloseDisplayed
            title={<Translation id="moduleLabeling.exportBip329BottomSheet.title" />}
        >
            <VStack spacing="sp24">
                <ExportBip329InfoHeader />
                <Button size="large" viewLeft="arrowDown" onPress={handleExportBip329}>
                    <Translation id="moduleLabeling.exportBip329BottomSheet.button" />
                </Button>
            </VStack>
        </BottomSheetModal>
    );
};
