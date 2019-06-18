import { Dispatch, GetState } from '@suite/types/onboarding/actions';
import * as FIRMWARE_UPDATE from '@suite/types/onboarding/firmwareUpdate';
import arrayBufferToBuffer from '@suite/utils/onboarding/arrayBufferToBuffer';

import { getFirmware } from './fetchActions';
import { firmwareErase, firmwareUpload } from './connectActions';

const setProgress = (progress: number) => ({
    type: FIRMWARE_UPDATE.SET_PROGRESS,
    progress,
});

const updateFirmware = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().onboarding.connect;
    const model = device.features.major_version;
    const versions: { [index: number]: string } = {
        1: 'trezor-1.8.1.bin',
        2: 'trezor-2.1.1.bin',
    };
    let fw;

    dispatch({
        type: FIRMWARE_UPDATE.SET_PROGRESS,
        progress: 0,
    });

    const progressFn = () => {
        dispatch({
            type: FIRMWARE_UPDATE.SET_PROGRESS,
            progress: getState().firmwareUpdate.progress + 1,
        });
    };
    let maxProgress = 0;
    const interval = setInterval(
        () => {
            if (
                getState().onboarding.connect.deviceCall.error ||
                getState().onboarding.fetch.error
            ) {
                dispatch({
                    type: FIRMWARE_UPDATE.SET_PROGRESS,
                    progress: 100,
                });
                clearInterval(interval);
                return;
            }
            if (getState().onboarding.firmwareUpdate.progress === 100) {
                clearInterval(interval);
            }
            if (getState().onboarding.firmwareUpdate.progress < maxProgress) {
                progressFn();
            }
        },
        device.features.major_version === 1 ? 170 : 561,
    );

    try {
        // todo [stick]: use special updating firware
        maxProgress = 10;
        dispatch(getFirmware(`/${model}/${versions[model]}`)).then(async (response: Response) => {
            if (!response.ok) {
                return;
            }
            maxProgress = 40;
            const ab = await response.arrayBuffer();
            if (model === 1) {
                fw = ab.slice(256);
            } else {
                fw = ab.slice(0);
            }
            fw = arrayBufferToBuffer(fw);

            const callResponse = await dispatch(
                firmwareErase({ keepSession: true, skipFinalReload: true, length: fw.byteLength }),
            );
            const payload: any = {
                payload: fw,
                keepSession: false,
                skipFinalReload: true,
            };
            if (callResponse.offset) {
                payload.offset = callResponse.offset;
            }
            if (callResponse.length) {
                payload.length = callResponse.lenght;
            }
            maxProgress = 99;
            await dispatch(firmwareUpload(payload));
            maxProgress = 100;
        });
    } catch (error) {
        // todo: handle error
        // dispatch({
        //     type: SET_APPLICATION_ERROR,
        //     error,
        // });
    }
};

export { setProgress, updateFirmware };
