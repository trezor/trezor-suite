// Default implementation, used on iOS and by TypeScript and Jest. Metro selects
// `shareQRCodeImage.android.ts` on Android instead.
import { Share } from 'react-native';

import type { ShareQRCodeImage } from './shareQRCodeImage.types';

export const shareQRCodeImage: ShareQRCodeImage = async ({ imageURI, title }) => {
    const { action } = await Share.share({ url: imageURI, title });

    return action === Share.dismissedAction ? 'dismissed' : 'shared';
};
