import { FirmwareInitial } from 'src/components/firmware';
import { closeModalApp } from 'src/actions/suite/routerActions';
import { useDispatch, useFirmware } from 'src/hooks/suite';
import { FirmwareModal } from './FirmwareModal';

type FirmwareUpdateProps = {
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareUpdate = ({ shouldSwitchFirmwareType }: FirmwareUpdateProps) => {
    const { firmwareUpdate, targetFirmwareType } = useFirmware({ shouldSwitchFirmwareType });
    const dispatch = useDispatch();

    const close = () => dispatch(closeModalApp());
    const installTargetFirmware = () =>
        firmwareUpdate({
            firmwareType: targetFirmwareType,
        });

    const heading = shouldSwitchFirmwareType ? 'TR_SWITCH_FIRMWARE' : 'TR_INSTALL_FIRMWARE';

    return (
        <FirmwareModal
            shouldSwitchFirmwareType={shouldSwitchFirmwareType}
            heading={heading}
            install={installTargetFirmware}
        >
            <FirmwareInitial
                shouldSwitchFirmwareType={shouldSwitchFirmwareType}
                standaloneFwUpdate
                onClose={close}
            />
        </FirmwareModal>
    );
};
