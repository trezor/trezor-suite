import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const T3W1_EMULATOR_CENTER_COORDINATES = { x: 200, y: 480 };

export async function pressContinue(model: Model): Promise<void> {
    if (model === 'T3W1') {
        await TrezorUserEnvLink.clickEmu(T3W1_EMULATOR_CENTER_COORDINATES);
    } else {
        await TrezorUserEnvLink.swipeEmu('up');
    }
}
