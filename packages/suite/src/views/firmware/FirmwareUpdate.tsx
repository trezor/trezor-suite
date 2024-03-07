import { DeviceModelInternal } from '@trezor/connect';

import { FirmwareInitial } from 'src/components/firmware';
import { closeModalApp } from 'src/actions/suite/routerActions';
import { useDispatch, useFirmware } from 'src/hooks/suite';
import { FirmwareModal } from './FirmwareModal';

type FirmwareUpdateProps = {
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareUpdate = ({ shouldSwitchFirmwareType = false }: FirmwareUpdateProps) => {
    const { firmwareUpdate, getTargetFirmwareType, uiEvent } = useFirmware();
    const dispatch = useDispatch();

    const deviceModelInternal = uiEvent?.payload.device.features?.internal_model;
    // Device will be wiped because Universal and Bitcoin-only firmware have different vendor headers on T2B1 or later devices.
    const deviceWillBeWiped =
        shouldSwitchFirmwareType && deviceModelInternal === DeviceModelInternal.T2B1;

    const close = () => dispatch(closeModalApp());
    const installTargetFirmware = () =>
        firmwareUpdate({
            firmwareType: getTargetFirmwareType(!!shouldSwitchFirmwareType),
        });

    const heading = shouldSwitchFirmwareType ? 'TR_SWITCH_FIRMWARE' : 'TR_INSTALL_FIRMWARE';

    return (
        <FirmwareModal heading={heading} install={installTargetFirmware}>
            <FirmwareInitial
                standaloneFwUpdate
                shouldSwitchFirmwareType={shouldSwitchFirmwareType}
                willBeWiped={deviceWillBeWiped}
                onClose={close}
            />
        </FirmwareModal>
    );
};
