import { nativeImage } from 'electron';

import { isMacOs, isWindows } from '@trezor/env-utils';

import { app } from '../typed-electron';
import type { ILogger } from './logger';

const LOG_PREFIX = 'process-icon';

type GetProcessIconParams = {
    path: string;
    logger: ILogger;
};

export const getProcessIcon = async ({ path, logger }: GetProcessIconParams) => {
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
        logger.warn(LOG_PREFIX, 'Failed to get icon of process - ' + error);
    }
};
