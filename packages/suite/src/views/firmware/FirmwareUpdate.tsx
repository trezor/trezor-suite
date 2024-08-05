import { DeviceModelInternal } from '@trezor/connect';

import { FirmwareInitial } from 'src/components/firmware';
import { closeModalApp } from 'src/actions/suite/routerActions';
import { useDevice, useDispatch, useFirmware } from 'src/hooks/suite';
import { FirmwareModal } from './FirmwareModal';

type FirmwareUpdateProps = {
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareUpdate = ({ shouldSwitchFirmwareType = false }: FirmwareUpdateProps) => {
    const { device } = useDevice();
    const { firmwareUpdate, getTargetFirmwareType } = useFirmware();
    const dispatch = useDispatch();

    const deviceModelInternal = device?.features?.internal_model;
    // Device will be wiped because Universal and Bitcoin-only firmware have different vendor headers, except T1B1 and T2T1.
    const deviceWillBeWiped =
        shouldSwitchFirmwareType &&
        deviceModelInternal &&
        ![DeviceModelInternal.T1B1, DeviceModelInternal.T2T1].includes(deviceModelInternal);

    const close = () => dispatch(closeModalApp());
    const installTargetFirmware = () =>
        firmwareUpdate({
            firmwareType: getTargetFirmwareType(!!shouldSwitchFirmwareType),
        });

    const heading = shouldSwitchFirmwareType ? 'TR_SWITCH_FIRMWARE' : 'TR_INSTALL_FIRMWARE';

    return (
        <FirmwareModal
            deviceWillBeWiped={deviceWillBeWiped}
            heading={heading}
            install={installTargetFirmware}
        >
            <FirmwareInitial
                standaloneFwUpdate
                shouldSwitchFirmwareType={shouldSwitchFirmwareType}
                willBeWiped={deviceWillBeWiped}
                onClose={close}
            />
        </FirmwareModal>
    );
};
