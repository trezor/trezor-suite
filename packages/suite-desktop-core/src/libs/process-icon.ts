import { nativeImage } from 'electron';

import { isMacOs, isWindows } from '@trezor/env-utils';

import { app } from '../typed-electron';

const LOG_PREFIX = 'process-icon';

export const getProcessIcon = async (path: string) => {
    try {
        const iconDim = { width: 48, height: 48 };
        if (isWindows()) {
            const icon = await app.getFileIcon(path, {
                size: 'normal',
            });

            if (icon.isEmpty()) {
                return undefined;
            }

            return icon.resize(iconDim).toDataURL();
        } else if (isMacOs()) {
            const icon = await nativeImage.createThumbnailFromPath(path, iconDim);
            if (icon.isEmpty()) {
                return undefined;
            }

            return icon.toDataURL();
        }
    } catch (error) {
        global.logger.warn(LOG_PREFIX, 'Failed to get icon of process - ' + error);
    }
};
