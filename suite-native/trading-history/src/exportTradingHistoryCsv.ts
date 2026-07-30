import { Platform } from 'react-native';

import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type ExportTradingHistoryCsvResult =
    | { success: true }
    | { success: false; reason: 'fileSavingNotSupported' | 'exportFailed' };

const CSV_MIME_TYPE = 'text/csv';

const buildFileName = (): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return `trade-history-${timestamp}.csv`;
};

const saveFile = async (fileName: string, content: string): Promise<void> => {
    const cachedFile = new File(Paths.cache, fileName);

    if (cachedFile.exists) {
        cachedFile.delete();
    }

    cachedFile.create();
    cachedFile.write(content);

    if (Platform.OS === 'android') {
        const dir = await Directory.pickDirectoryAsync();
        const newFile = dir.createFile(fileName, CSV_MIME_TYPE);
        newFile.write(content);
    } else if (Platform.OS === 'ios') {
        await Sharing.shareAsync(cachedFile.uri, {
            mimeType: CSV_MIME_TYPE,
            UTI: 'public.comma-separated-values-text',
        });
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

        return { success: false, reason: 'exportFailed' };
    }

    return { success: true };
};
