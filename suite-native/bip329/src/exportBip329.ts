import { Platform } from 'react-native';

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { suiteSyncToBip329 } from '@suite-common/bip329';
import { type AllLabelsForAccount } from '@suite-common/suite-sync';
import { sanitizeFilename } from '@trezor/utils';

type ExportBip329Result =
    | { success: true }
    | { success: false; reason: 'fileSavingNotSupported' | 'exportFailed' | 'cancelled' };

const PICKER_CANCELLED_ERROR_CODE = 'ERR_PICKER_CANCELLED';

const createJsonlContent = (labels: AllLabelsForAccount): string => {
    const labelsToExport = suiteSyncToBip329({
        outputLabels: labels.outputLabels,
        addressLabels: labels.addressLabels,
        allSpendable: true,
    });

    return labelsToExport.map(obj => JSON.stringify(obj)).join('\n');
};

const buildFileName = (accountLabel: string | null): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeLabel = sanitizeFilename(accountLabel ?? 'account_labels') ?? 'account_labels';

    return `${safeLabel}-${timestamp}.jsonl`;
};

const saveFile = async (fileName: string, content: string): Promise<void> => {
    if (Platform.OS === 'android') {
        const dir = await Directory.pickDirectoryAsync();
        const newFile = dir.createFile(fileName, 'application/jsonl');
        newFile.write(content);
    } else if (Platform.OS === 'ios') {
        const cachedFile = new File(Paths.cache, fileName);

        if (cachedFile.exists) {
            cachedFile.delete();
        }

        try {
            cachedFile.create();
            cachedFile.write(content);

            await Sharing.shareAsync(cachedFile.uri, {
                UTI: 'public.jsonl',
            });
        } finally {
            cachedFile.delete();
        }
    } else {
        throw new Error('fileSavingNotSupported');
    }
};

export const exportBip329 = async (
    accountLabel: string | null,
    labels: AllLabelsForAccount,
): Promise<ExportBip329Result> => {
    const content = createJsonlContent(labels);
    const fileName = buildFileName(accountLabel);

    try {
        await saveFile(fileName, content);
    } catch (error) {
        if (error instanceof Error && error.message === 'fileSavingNotSupported') {
            return { success: false, reason: 'fileSavingNotSupported' };
        }

        if (error?.code === PICKER_CANCELLED_ERROR_CODE) {
            return { success: false, reason: 'cancelled' };
        }

        return { success: false, reason: 'exportFailed' };
    }

    return { success: true };
};
