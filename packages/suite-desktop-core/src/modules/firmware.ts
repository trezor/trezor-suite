import { ModuleInit } from '.';
import { app } from '../typed-electron';
import { readDir, saveBuffer } from '../libs/user-data';
import { FirmwareType } from '@trezor/connect';
import { buildFirmwareFileName } from '@trezor/connect/src/utils/firmwareUtils';
import { DeviceModelInternal, VersionArray } from '@trezor/device-utils';

export const SERVICE_NAME = '@trezor/firmware';

const FIRMWARE_DIR = '/firmware';

export const getStoredFirmwares = async () => {
    const userDataDir = app?.getPath('userData');
    const resp = await readDir(FIRMWARE_DIR);
    if (!resp.success) {
        return { success: false, error: resp.error };
    }
    const { payload } = resp;

    return {
        success: true,
        payload: {
            firmwareDir: `${userDataDir}${FIRMWARE_DIR}/`,
            firmwares: payload,
        },
    };
};

export const init: ModuleInit = ({ mainThreadEmitter }) => {
    mainThreadEmitter.on(
        'module/trezor-connect/firmware-store',
        async (event: {
            binary: ArrayBuffer;
            binaryVersion: VersionArray;
            releaseVersion: Number[];
            internalModel: DeviceModelInternal;
            firmwareType: FirmwareType;
        }) => {
            const {
                binary,
                binaryVersion,
                internalModel,
                firmwareType = FirmwareType.Regular,
            } = event;

            const firmwareBinName = buildFirmwareFileName(
                firmwareType,
                internalModel,
                binaryVersion,
            );

            const { success, error, payload } = await getStoredFirmwares();
            if (!success || !payload) {
                logger.error(SERVICE_NAME, `Failed to read firmware directory: ${error}`);
                return;
            }

            const { firmwares } = payload;

            if (!firmwares.includes(firmwareBinName)) {
                logger.info(
                    SERVICE_NAME,
                    `Saving new downloaded firmware: ${firmwareBinName} to ${FIRMWARE_DIR}`,
                );

                const saveFwResponse = await saveBuffer(FIRMWARE_DIR, firmwareBinName, binary);
                if (!saveFwResponse.success) {
                    logger.error(SERVICE_NAME, `Failed to save firmware: ${saveFwResponse.error}`);
                    return; // Early return on error
                }

                // Emit updated firmware list only if the firmware was saved successfully
                const updatedFirmwares = await getStoredFirmwares();
                mainThreadEmitter.emit('module/firmware/list', updatedFirmwares.payload);
            } else {
                logger.info(
                    SERVICE_NAME,
                    `Firmware ${firmwareBinName} already exists, skipping save.`,
                );
            }
        },
    );
};
