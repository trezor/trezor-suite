import { Platform } from 'react-native';

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { suiteSyncToBip329 } from '@suite-common/bip329';
import { type AllLabelsForAccount } from '@suite-common/suite-sync';
import { sanitizeFilename } from '@trezor/utils';

type ExportBip329Result =
    | { success: true }
    | { success: false; reason: 'fileSavingNotSupported' | 'exportFailed' };

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
    const cachedFile = new File(Paths.cache, fileName);
    cachedFile.create();
    cachedFile.write(content);

    if (Platform.OS === 'android') {
        const dir = await Directory.pickDirectoryAsync();
        const newFile = dir.createFile(fileName, 'application/jsonl');
        newFile.write(content);
    } else if (Platform.OS === 'ios') {
        await Sharing.shareAsync(cachedFile.uri, {
            mimeType: 'application/jsonl',
            UTI: 'public.jsonl',
        });
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

        return { success: false, reason: 'exportFailed' };
    }

    return { success: true };
};
