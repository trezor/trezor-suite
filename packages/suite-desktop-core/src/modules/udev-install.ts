import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import { app, ipcMain } from '../typed-electron';

import type { Module } from './index';

const FILE_NAME = '51-trezor.rules';

const fileExists = async (filePath: string) => {
    try {
        await fs.promises.stat(filePath);

        return true;
    } catch (error) {
        // file is not present
    }

    return false;
};

export const SERVICE_NAME = 'udev';

export const init: Module = () => {
    ipcMain.handle('udev/install', async () => {
        const { logger, resourcesPath } = global;
        const resourceRules = path.join(resourcesPath, `bin/udev/${FILE_NAME}`);
        const userRules = path.join(app.getPath('userData'), FILE_NAME);
        const distRules = path.join('/etc/udev/rules.d/', FILE_NAME);

        logger.info(SERVICE_NAME, `Installing ${resourceRules} > ${userRules} > ${distRules}`);

        if (await fileExists(distRules)) {
            logger.error(SERVICE_NAME, `/etc/udev rules already installed: ${distRules}`);

            // /etc/udev already exists, break here.
            // TODO: should override anyway?
            return { success: false, error: `File ${distRules} already exists` };
        }

        if (!(await fileExists(userRules))) {
            try {
                logger.info(SERVICE_NAME, `Create user data rules: ${userRules}`);
                // copy rules from app resources (/tmp/...) to user data files (~/.cache/...)
                // this step is required. `pkexec` returns "Permission denied" error when copying directly from app resources.
                await fs.promises.copyFile(resourceRules, userRules);
                // chmod to read-only
                await fs.promises.chmod(userRules, 0o444);
            } catch (error) {
                logger.error(SERVICE_NAME, `User data rules error ${error}`);

                return { success: false, error: `${error}` };
            }
        }

        return new Promise(resolve => {
            logger.info(SERVICE_NAME, `Copy rules from ${userRules} to ${distRules}`);
            // request superuser permissions and copy from user data files to /etc/udev
            // NOTE: https://github.blog/2021-06-10-privilege-escalation-polkit-root-on-linux-with-bug/
            const pkexec = spawn('pkexec', ['cp', userRules, distRules]);

            pkexec.on('error', error => {
                logger.error(SERVICE_NAME, `pkexec error ${error}`);
                resolve({ success: false, error: `pkexec error ${error.message}` });
            });

            pkexec.on('exit', code => {
                logger.debug(SERVICE_NAME, `pkexec exit with code ${code}`);
                if (code === 0) {
                    resolve({ success: true });
                } else if (code === 126) {
                    resolve({ success: false, error: `pkexec authentication dialog dismissed` });
                } else {
                    resolve({ success: false, error: `pkexec exit with code ${code}` });
                }
            });
        });
    });
};
