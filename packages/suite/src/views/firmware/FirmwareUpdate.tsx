import { FirmwareInitial } from 'src/components/firmware';
import { closeModalApp } from 'src/actions/suite/routerActions';
import { useDispatch, useFirmware } from 'src/hooks/suite';
import { FirmwareModal } from './FirmwareModal';

export const FirmwareUpdate = () => {
    const { firmwareUpdate, shouldSwitchFirmwareType, targetFirmwareType } = useFirmware();
    const dispatch = useDispatch();

    const close = () => dispatch(closeModalApp());
    const installTargetFirmware = () =>
        firmwareUpdate({
            firmwareType: targetFirmwareType,
        });

    const heading = shouldSwitchFirmwareType ? 'TR_SWITCH_FIRMWARE' : 'TR_INSTALL_FIRMWARE';

    return (
        <FirmwareModal heading={heading} install={installTargetFirmware}>
            <FirmwareInitial standaloneFwUpdate onClose={close} />
        </FirmwareModal>
    );
};
