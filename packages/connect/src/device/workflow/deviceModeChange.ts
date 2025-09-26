import { WorkflowContext } from '../../types/workflow';

type Context = {
    device: WorkflowContext['device'];
    signal: AbortSignal;
    // logger?: Log;
};

export const foo = async (ctx: Context, data: number[]) => {
    const [, event, mode] = data;
    const { device } = ctx;

    // this.rebooting = event === 0;
    // this.busy = event === 0 || event === 2;

    // if (device.currentRun) {
    //     device.
    // }

    if (mode === 1) {
        if (device.thp?.properties || (device.features && !device.features.bootloader_mode)) {
            device._updateFeature('bootloader_mode', true);
            device._protocol = protocolV1;
            device.thp = undefined;
        }
        if (event === 0 || event === 2) {
            // device busy
            device.busy = true;
            device.lifecycle.emit(DEVICE.CHANGED);
        }
        if (event === 1) {
            // device unlocked
            await device.acquire();
            await device.getFeatures();
            device.busy = false;
            await device.release();
        }
    } else if (mode === 0) {
        if (device.features?.bootloader_mode) {
            device._updateFeature('bootloader_mode', false);
            await device.setupThp();
        }
        if (event === 0 || event === 2) {
            // device busy
            device.busy = true;
            device.lifecycle.emit(DEVICE.CHANGED);
        }
        if (event === 1) {
            const withInteraction = false; // TODO in fw update flow we want to wait
            // device unlocked
            await resolveAfter(1000);
            await device.acquire();
            await getThpChannel(device, withInteraction);
            await device.getFeatures();
            device.busy = false;
            await device.release();
        }
    }
};
