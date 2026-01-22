import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const shareAsTextFile = async ({
    textContent,
    filename,
}: {
    textContent: string;
    filename: string;
}) => {
    try {
        const file = new File(Paths.cache, filename);

        if (file.exists) {
            file.delete();
        }

        file.create();
        file.write(textContent);

        await Sharing.shareAsync(file.uri, {
            mimeType: 'text/plain',
            UTI: 'public.plain-text',
        });
    } catch (error) {
        console.error(error);
    }
};
