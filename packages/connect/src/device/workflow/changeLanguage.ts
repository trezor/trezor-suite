import { ERRORS } from '@trezor/connect-common/src/constants';

import { getLanguage } from '../../data/firmwareInfo';
import type { IDevice } from '../../types/idevice';

const uploadTranslationData = async (device: IDevice, payload: ArrayBuffer | null) => {
    if (payload === null) {
        const response = await device.getCurrentSession().typedCall(
            'ChangeLanguage',
            ['Success'],
            { data_length: 0 }, // For en-US where we just send `ChangeLanguage(size=0)`
        );

        return response.message;
    }

    const length = payload.byteLength;

    device.startPiggybackAck();
    let response = await device
        .getCurrentSession()
        .typedCall('ChangeLanguage', ['DataChunkRequest', 'Success'], { data_length: length });

    while (response.type !== 'Success') {
        const start = response.message.data_offset!;
        const end = response.message.data_offset! + response.message.data_length!;
        const chunk = payload.slice(start, end);

        response = await device
            .getCurrentSession()
            .typedCall('DataChunkAck', ['DataChunkRequest', 'Success'], {
                data_chunk: Buffer.from(chunk).toString('hex'),
            });
    }
    await device.stopPiggybackAck();

    return response.message;
};

type Context = {
    device: IDevice;
} & ({ language?: undefined; binary: ArrayBuffer } | { language: string; binary?: undefined });

export const changeLanguage = async ({ device, language, binary }: Context) => {
    if (language === 'en-US') {
        return uploadTranslationData(device, null);
    }

    if (binary) {
        return uploadTranslationData(device, binary);
    }

    const version = device.getVersion();
    if (!version) {
        throw ERRORS.TypedError('Runtime', 'changeLanguage: device version unknown');
    }

    if (!device.firmwareType) {
        throw ERRORS.TypedError('Runtime', 'changeLanguage: firmware type unknown');
    }

    if (!device.currentRelease) {
        throw ERRORS.TypedError('Runtime', 'changeLanguage: release not found');
    }
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const languageBinPath: string = device.currentRelease.translations[language];
    const downloadedBinary = await getLanguage(languageBinPath);

    if (!downloadedBinary) {
        throw ERRORS.TypedError('Runtime', 'changeLanguage: translation not found');
    }

    // This is mostly to satisfy Types, since `downloadedBinary` could be ArrayBuffer or Buffer<ArrayBufferLike>
    // but `_uploadTranslationData` takes only ArrayBuffer or null.
    let dataToSend: ArrayBuffer;
    if (Buffer.isBuffer(downloadedBinary)) {
        // Creates a "copy" if given a Buffer/Uint8Array in order to guarantee dataToSend is ArrayBuffer.
        dataToSend = new Uint8Array(downloadedBinary).buffer;
    } else {
        dataToSend = downloadedBinary;
    }

    return uploadTranslationData(device, dataToSend);
};
