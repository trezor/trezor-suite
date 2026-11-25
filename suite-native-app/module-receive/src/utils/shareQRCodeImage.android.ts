// This is the Android implementation selected by Metro through the `.android` filename suffix.
import * as Sharing from 'expo-sharing';

import { getShareableFileURI } from './getShareableFileURI';
import type { ShareQRCodeImage } from './shareQRCodeImage.types';

export const shareQRCodeImage: ShareQRCodeImage = async ({ imageURI, title }) => {
    await Sharing.shareAsync(getShareableFileURI(imageURI), {
        dialogTitle: title,
        mimeType: 'image/png',
    });

    return true;
};
