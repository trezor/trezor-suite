// This is the Android implementation selected by Metro through the `.android` filename suffix.
import * as Sharing from 'expo-sharing';

import type { ShareQRCodeImage } from './shareQRCodeImage.types';

export const shareQRCodeImage: ShareQRCodeImage = async ({ imageURI, title }) => {
    await Sharing.shareAsync(imageURI, {
        dialogTitle: title,
        mimeType: 'image/png',
    });

    // The Android share sheet does not report whether the user shared or dismissed it.
    return 'unknown';
};
