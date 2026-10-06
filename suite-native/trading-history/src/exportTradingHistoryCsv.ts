import { Platform } from 'react-native';

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportTradingHistoryCsvResult =
    | { success: true }
    | { success: false; reason: 'fileSavingNotSupported' | 'exportFailed' | 'cancelled' };

const CSV_MIME_TYPE = 'text/csv';

const PICKER_CANCELLED_ERROR_CODE = 'ERR_PICKER_CANCELLED';

const buildFileName = (): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return `trade-history-${timestamp}.csv`;
};

const saveFile = async (fileName: string, content: string): Promise<void> => {
    if (Platform.OS === 'android') {
        const dir = await Directory.pickDirectoryAsync();
        const newFile = dir.createFile(fileName, CSV_MIME_TYPE);
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
                UTI: 'public.comma-separated-values-text',
            });
        } finally {
            cachedFile.delete();
        }
    } else {
        throw new Error('fileSavingNotSupported');
    }
};

export const exportTradingHistoryCsv = async (
    csvContent: string,
): Promise<ExportTradingHistoryCsvResult> => {
    const fileName = buildFileName();

    try {
        await saveFile(fileName, csvContent);
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
