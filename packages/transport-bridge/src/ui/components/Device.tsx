import { Descriptor } from '@trezor/transport/src/types';

interface DeviceProps {
    device: Descriptor;
}

export const Device = ({ device }: DeviceProps) => {
    const modelName = (() => {
        switch (device.type) {
            case 0:
                return 'Trezor One (HID)';
            case 1:
                return 'Trezor One (WebUSB)';
            case 2:
                return 'Trezor One (WebUSB Bootloader)';
            case 3:
                return 'Trezor Model T / Trezor Safe 3 / Trezor Safe 5';
            case 4:
                return 'Trezor Model T / Trezor Safe 3 / Trezor Safe 5  Bootloader';
            case 5:
                return 'Emulator';
        }
    })();

    return (
        <div>
            {/* I am inclined not to translate model, path and session */}
            <div>model: {modelName}</div>
            <div>path: {device.path}</div>
            <div>session: {device.session ? device.session : 'none'}</div>
            {device.session && (
                <div>session owner: {device.sessionOwner ? device.sessionOwner : 'unknown'}</div>
            )}
        </div>
    );
};
